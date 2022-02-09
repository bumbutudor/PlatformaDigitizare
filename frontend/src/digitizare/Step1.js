"use strict";

import React, { Component, useRef } from "react";
import FileUpload from "../components/FileUpload";
import Icon from "@mdi/react";
import { mdiInformation } from "@mdi/js";

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
                    title="Fișierele pot fi de tipul: .jpg, .jpeg, .png, .tif, .pdf."
                  />
                </h1>
                <label className="mx-2">
                  Fișierele pot fi de tipul: .jpg, .jpeg, .png, .tif, .pdf.
                </label>
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
