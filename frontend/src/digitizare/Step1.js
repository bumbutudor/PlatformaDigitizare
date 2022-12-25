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
    this.step1Info = (<>
    
      {StepsInfo.step1Info.body}
      <p>Se acceptă următoarele tipuri de fișiere la incarcare: <b>png, jpg si tiff</b>.</p>
      <p>Fișierele PDF nu se pot prelucra in versiunea demo a aplicatiei.</p>
      <p>Pot fi încărcate mai multe fișiere într-un singur ciclu de digitizare.</p>

      <p>Un singur fișier incărcat nu va trece limita de 100MB.
      Toate fișierele incărcate la un singur ciclu de digitizare nu vor trece limita de 700MB.
      </p>
      <p>
      Atunci când vor fi selectate două sau mai multe fișiere, trebuie de luat în considerare că toate aceste fișiere vor fi procesate cu aceleași opțiuni de procesare, respectiv, trebuie să vă asigurați că fișierele încărcate sunt din aceeași perioadă, au unul și același alfabet și necesită aceleași opțiuni de preprocesare a imaginii. Dacă aveți seturi de documente din mai multe perioade, atunci aceste seturi vor fi digitizate în diferite cicluri de digitizare.
      </p>
      <p>
      Este posibilitatea de a șterge unele fișiere care au fost întamplator selectate in acest pas.
      </p>
</>);

    this.Popover = (
      <Popover id="popover-basic">
        <Popover.Header as="h4">{StepsInfo.step1Info.title}</Popover.Header>
        <Popover.Body>
          {this.step1Info}
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
          {this.step1Info}
        </div>

      </div>
    );
  }
}


