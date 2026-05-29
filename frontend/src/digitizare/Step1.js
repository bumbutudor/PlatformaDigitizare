"use strict";

import React, { Component, useRef, useState, useEffect } from "react";
import FileUpload from "../components/FileUpload";
import "tui-image-editor/dist/tui-image-editor.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import StepsInfo from "../components/StepsInfo";
import ServiceGate from "../components/ServiceGate";
import { SERVICES } from "../utils/ServiceStatus";


export default class Step1 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedPeriod: props.getStore().period || "secolulXX"
    };

    this.Popover = (
      <Popover id="popover-basic">
        <Popover.Header as="h4">{StepsInfo.step1Info.title}</Popover.Header>
        <Popover.Body>
          <div dangerouslySetInnerHTML={{ __html: StepsInfo.step1Info.body }} />
        </Popover.Body>

      </Popover>
    )
  }

  componentDidMount() { }

  componentWillUnmount() { }

  handleClickButton() {
    const editorInstance = this.editorRef.current.getInstance();
    editorInstance.flipX();
  }

  handlePeriodChange = (e) => {
    const period = e.target.value;
    this.setState({ selectedPeriod: period });
    this.props.updateStore({ period: period });
  }

  render() {
    const periodOptions = this.props.getStore().periodOptions;

    return (
      <div className="step step1">
        <div className="row">
          <Form id="Form" className="form-horizontal">
            <Form.Group className="form-group">
              <Form.Label className="col-md-12 control-label d-flex">
                <h1>Pasul 1: Incarcă documentul tău</h1>
                <OverlayTrigger trigger="click" rootClose placement="right" overlay={this.Popover}>
                  <Button type="button" className="btn btn-info text-white mx-4">Info</Button>
                </OverlayTrigger>
              </Form.Label>
              
              {/* Selector pentru perioada documentului */}
              <Form.Group className="mb-3 col-md-6">
                <Form.Label><strong>1.1 Selectează perioada documentului:</strong></Form.Label>
                <Form.Select 
                  value={this.state.selectedPeriod}
                  onChange={this.handlePeriodChange}
                  className="mb-3"
                >
                  {Object.entries(periodOptions).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  Perioada ajută la selectarea modelului OCR potrivit pentru documentul tău.
                </Form.Text>
              </Form.Group>

              <Form.Label><strong>1.2 Încarcă fișierele:</strong></Form.Label>
              <ServiceGate requiredServices={[SERVICES.S3]} />
              <FileUpload
                jumpToStep={(i) => this.props.jumpToStep(i)}
                getStore={() => this.props.getStore()}
                updateStore={(u) => {
                  this.props.updateStore(u);
                }}
              />
            </Form.Group>
          </Form>
        </div>
        <div className="row">
          <div dangerouslySetInnerHTML={{ __html: StepsInfo.step1Info.body }} />
        </div>

      </div>
    );
  }
}


