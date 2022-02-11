"use strict";

import React, { Component, useRef, useState, useEffect } from "react";
import FileUpload from "../components/FileUpload";
import Icon from "@mdi/react";
import { mdiInformation } from "@mdi/js";

import "tui-image-editor/dist/tui-image-editor.css";
import ImageEditor from "@toast-ui/react-image-editor";

export default class Step1 extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {}

  componentWillUnmount() {}

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
          <form id="Form" className="form-horizontal">
            <div className="form-group">
              <label className="col-md-12 control-label">
                <h1>
                  <span>Pasul 1: Incarcă imagini sau fișiere PDF</span>
                  <Icon
                    path={mdiInformation}
                    className="mx-2"
                    title="information"
                    size={1}
                    horizontal
                    vertical
                    color="orange"
                    title="Se acceptă următoarele formate ale documentelor: png, jpg, tiff și pdf. Pot fi incarcate mai multe documente intr-un singur ciclu de digitizare. Calitatea imaginilor incarcate se pune in proportionalitate directa cu rezultele obtinute. Un singur fisier incarcat nu va trece limita de 100MB.
                    Toate fisierele incarcate la un singur ciclu de digitizare nu vor trece limita de 700MB. Este posibilitatea de a sterge unele documente care au fost intamplator selectate in acest pas."
                  />
                </h1>
                <label className="mx-2">
                  Fișierele pot fi de tipul: .jpg, .jpeg, .png, .tif, .pdf.
                </label>
              </label>
              <ImageEditor
                includeUI={{
                  menu: ["shape", "filter"],
                  initMenu: "filter",
                  uiSize: {
                    width: "100%",
                    height: "650px",
                  },
                  menuBarPosition: "bottom",
                }}
                cssMaxHeight={350}
                cssMaxWidth={600}
                selectionStyle={{
                  cornerSize: 20,
                  rotatingPointOffset: 70,
                }}
                usageStatistics={true}
              />
              {/* <FileUpload
                jumpToStep={(i) => this.props.jumpToStep(i)}
                getStore={() => this.props.getStore()}
                updateStore={(u) => {
                  this.props.updateStore(u);
                }}
              /> */}
            </div>
          </form>
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
