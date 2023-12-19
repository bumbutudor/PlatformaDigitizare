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


export default class Step1 extends Component {
  constructor(props) {
    super(props);
    this.state = {};

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

  render() {

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


