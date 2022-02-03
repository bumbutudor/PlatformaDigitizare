"use strict";

import React from "react";
import Lightbox from "react-awesome-lightbox";
// You need to import the CSS only once
import "react-awesome-lightbox/build/style.css";

const Step2 = (props) => (
  console.log(props.getStore()),
  <div className="step step2">
    <div className="row">
      <form id="Form" className="form-horizontal">
        <div className="form-group">
          <label className="col-md-12 control-label">
            <h1>Pasul 2: Preprocesarea imaginilor încărcate</h1>
          </label>
          <div className="row content">

            <div className="col-md-12 eg-jump-lnk">
              <a href="#" onClick={() => props.jumpToStep(2)}>
                Umrmatorul pas
              </a>
            </div>
          </div>
        </div>
      </form>
      {props.getStore().sourceFiles.map((src, index) => (
              <img
                src={src}
                onClick={() => openImageViewer(index)}
                width="300"
                key={index}
                style={{ margin: "2px" }}
                alt=""
              />
            ))}


    </div>
  </div>
);

export default Step2;
