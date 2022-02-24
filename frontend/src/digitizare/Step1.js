"use strict";

import React, { Component, useRef, useState, useEffect } from "react";
import FileUpload from "../components/FileUpload";
import Icon from "@mdi/react";
import { mdiInformation } from "@mdi/js";
import "tui-image-editor/dist/tui-image-editor.css";
import ImageEditor from "@toast-ui/react-image-editor";
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

    this.step1Info = (
      <Popover id="popover-basic">
        <Popover.Header as="h4">{StepsInfo.step1Info.title}</Popover.Header>
        <Popover.Body>
          {StepsInfo.step1Info.body}
          Pregatirea si incarcarea <strong> documentului scanat </strong> din calculatorul utilizatorului.
          Se acceptă următoarele formate ale documentelor: png, jpg, tiff și pdf.
          Pot fi incarcate mai multe documente intr-un singur ciclu de digitizare.
          Calitatea imaginilor incarcate se pune in proportionalitate directa cu rezultele obtinute.
          O imagine unde la zoom maxim nu prea se vede bine continutul va genera un rezultat nesatisfacator.
          Un singur fisier incarcat nu va trece limita de 100MB.
          Toate fisierele incarcate la un singur ciclu de digitizare nu vor trece limita de 700MB.
          Este posibilitatea de a sterge unele documente care au fost intamplator selectate in acest pas.
        </Popover.Body>
      </Popover>
    );
  }

  componentDidMount() { }

  componentWillUnmount() { }

  // not required as this component has no forms or user entry
  // isValidated() {}

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
                <h1>Pasul 1: Incarcă imagini sau fișiere PDF</h1>
                <OverlayTrigger trigger="click" rootClose placement="right" overlay={this.step1Info}>
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
      </div>
    );
  }
}

/*

<div className="step step1">
        <div className="row">
          <form id="Form" className="form-horizontal">
            <div className="form-group">
              <label className="col-md-12 control-label">
                <h1>
                  Pasul 1: Incarcă imagini sau fișiere PDF
                </h1>
                <h3 className="info">
                  Fișierele pot fi de tipul: .jpg, .jpeg, .png, .tif, .pdf.
                  <a href="#" onClick={() => this.props.jumpToStep(1)}>
                    Hopa!
                  </a>
                </h3>
              </label>
              <FileUpload
                jumpToStep={(i) => this.props.jumpToStep(i)}
                getStore={() => this.props.getStore()}
                updateStore={(u) => {
                  this.props.updateStore(u);
                }}
              />
            </div>
          </form>
        </div>
      </div>
      
      */
