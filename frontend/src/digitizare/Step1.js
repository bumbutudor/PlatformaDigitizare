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
          Se acceptă următoarele tipuri de fișiere: <b>png, jpg, tiff și pdf</b>.
          <br /><br />
          Pot fi încărcate mai multe fișiere într-un singur ciclu de digitizare.
          <br /><br />
          Un singur fișier incărcat nu va trece limita de 100MB.
          Toate fișierele incărcate la un singur ciclu de digitizare nu vor trece limita de 700MB.
          <br /><br />
          Atunci când vor fi selectate mai două sau mai multe fișiere, trebuie de luat în considerare că toate aceste fișiere vor fi procesate cu aceleași opțiuni de procesare, respectiv, trebuie să vă asigurați că fișierele încărcate sunt din aceeași perioadă, au unul și același alfabet și necesită aceleași opțiuni de preprocesare a imaginii. Dacă aveți seturi de documente din mai multe perioade, atunci aceste seturi vor fi digitizate în diferite cicluri de digitizare.
          <br /><br />
          Este posibilitatea de a șterge unele fișiere care au fost întamplator selectate in acest pas.
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
                <h1>Pasul 1: Incarcă documentul tău</h1>
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
