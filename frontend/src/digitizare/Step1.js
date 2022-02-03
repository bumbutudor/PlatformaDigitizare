"use strict";

import React, { Component, useRef } from "react";
import FileUpload from "../components/FileUpload";

export default class Step1 extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  componentDidMount() {}

  componentWillUnmount() {}

  // not required as this component has no forms or user entry
  // isValidated() {}

  render() {
    return (
      <div className="step step1">
        <div className="row">
          <form id="Form" className="form-horizontal">
            <div className="form-group">
              <label className="col-md-12 control-label">
                <h1>Pasul 1: Incarcă imagini sau fișiere PDF</h1>
                <h3 className="info">
                  Fișierele pot fi de tipul: .jpg, .jpeg, .png, .tif, .pdf.
                </h3>
              </label>
              <FileUpload />

              <div className="col-md-12 eg-jump-lnk">
                <h3>
                  Daca ai deja textul chirilic in format .txt sau .docx, poti
                  omite acest past și sari la pasul 5 cu transliterarea
                  textului.
                </h3>
                <a href="#" onClick={() => props.jumpToStep(1)}>
                  Sari la pasul 5
                </a>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }
}
