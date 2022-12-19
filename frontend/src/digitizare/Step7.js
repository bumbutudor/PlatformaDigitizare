"use strict";

import React, { Component } from "react";
import Promise from "promise";
import "react-awesome-lightbox/build/style.css";
import Form from "react-bootstrap/Form";
import Accordion from "react-bootstrap/Accordion";
import Button from "react-bootstrap/Button";
import RangeSlider from "react-bootstrap-range-slider";
import "react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css";
import { mdiSourceCommitStartNextLocal } from "@mdi/js";
import ImgsViewer from "react-images-viewer";
import { Fancybox } from "@fancyapps/ui/src/Fancybox/Fancybox.js";
import "@fancyapps/ui/dist/fancybox.css";
import { saveAs } from "file-saver";
import { Rnd } from "react-rnd";
import Draggable from "react-draggable";

export default class Step7 extends Component {
  constructor(props) {
    super(props);

    this.state = {
      ocrResults: props.getStore().ocrResults,
      transResults: props.getStore().transResults,
      sourceFiles: props.getStore().sourceFiles,
      preprocessedFiles: props.getStore().preprocessedFiles,
      layoutName: "default",
      show: false,
      // input: ""
      inputID: 0,
      saving: false,
    };
    this.isValidated = this.isValidated.bind(this);
    this.API = props.getStore().api;
  }

  componentDidMount() { }

  componentWillUnmount() { }

  // This review screen had the 'Save' button, on clicking this is called
  isValidated() {
    /*
    typically this method needs to return true or false (to indicate if the local forms are validated, so StepZilla can move to the next step),
    but in this example we simulate an ajax request which is async. In the case of async validation or server saving etc. return a Promise and StepZilla will wait
    ... for the resolve() to work out if we can move to the next step
    So here are the rules:
    ~~~~~~~~~~~~~~~~~~~~~~~~
    SYNC action (e.g. local JS form validation).. if you return:
    true/undefined: validation has passed. Move to next step.
    false: validation failed. Stay on current step
    ~~~~~~~~~~~~~~~~~~~~~~~~
    ASYNC return (server side validation or saving data to server etc).. you need to return a Promise which can resolve like so:
    resolve(): validation/save has passed. Move to next step.
    reject(): validation/save failed. Stay on current step
    */

    this.setState({
      saving: true,
    });

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.setState({
          saving: true,
        });

        this.props.updateStore({ savedToCloud: true }); // Update store here (this is just an example, in reality you will do it via redux or flux)

        // call resolve() to indicate that server validation or other aync method was a success.
        // ... only then will it move to the next step. reject() will indicate a fail
        resolve();
        // reject(); // or reject
      }, 5000);
    });
  }

  jumpToStep(toStep) {
    // We can explicitly move to a step (we -1 as its a zero based index)
    this.props.jumpToStep(toStep - 1); // The StepZilla library injects this jumpToStep utility into each component
  }

  handleFilePath(filePath) {
    if (filePath.length > 0) return this.API + filePath;
    //https://httpbin.org/post
    //http://127.0.0.1:8000/media/
    return "https://cdn.presslabs.com/wp-content/uploads/2018/10/upload-error.png";
  };

  save_image(event) {
    const file_url = this.handleFilePath(this.state.preprocessedFiles[0]);
    saveAs(file_url, 'image.jpg')
  }
  save_ocr(event) {
    /* let exampleText = "My text"; */
    /* this.state.ocrResults */
    var blob = new Blob(["Textul recunoscut ", "\n\n", this.state.ocrResults], {
      type: "text/plain;charset=utf-8",
    });
    saveAs(blob, "OCR" + ".txt");
  }
  save_ocr_doc(event) {
    /* let exampleText = "My text docx"; */
    /* this.state.ocrResults */
    var blob = new Blob(["Textul recunoscut ", "\n\n", this.state.ocrResults], {
      type: "application/msword",
    });
    saveAs(blob, "OCR" + ".doc");
  }
  save_trans(event) {
    var blob = new Blob(["Textul transliterat: ", "\n\n", this.state.transResults], {
      type: "text/plain;charset=utf-8",
    });
    saveAs(blob, "Transliterat" + ".txt");
  }
  save_trans_doc(event) {
    var blob = new Blob(["Textul transliterat: ", "\n\n", this.state.transResults], {
      type: "application/msword",
    });
    saveAs(blob, "Transliterat" + ".doc");
  }

  render() {
    // Fisierele sursa

    const sourceFiles = this.props.getStore().sourceFiles;
    const [preprocessedFiles, setpreprocessedFiles] =
      this.props.getStore().preprocessedFiles;

    const savingCls = this.state.saving
      ? "saving col-md-12 show"
      : "saving col-md-12 hide";

    return (
      <div className="step step7 review">
        <div className="row">
          <form id="Form" className="form-horizontal">
            <div className="form-group">
              <label className="col-md-12 control-label mb-3">
                <h1>Step 7: Salvează rezultatele</h1>
              </label>
            </div>
            {this.props.getStore().preprocessedFiles.length != 0 && (
              <div className="form-group row">
                <div className="col-4">
                  <Draggable>
                    <Accordion defaultActiveKey={["0"]} alwaysOpen>
                      <Accordion.Item eventKey="0">
                        <Accordion.Header>
                          Documentul original
                        </Accordion.Header>
                        <Accordion.Body>
                          {this.props
                            .getStore()
                            .preprocessedFiles.map((src, index) => (
                              console.log(src),
                              <a
                                className=""
                                data-fancybox="gallery_2"
                                data-src={this.handleFilePath(src)}
                                data-caption={"imagine preprocesată"}
                                key={index}
                              >
                                <img
                                  className="Accordion_image"
                                  src={this.handleFilePath(src)}
                                />
                              </a>
                            ))}
                          <button
                            type="button"
                            className="btn btn-link col-12"
                            onClick={this.save_image.bind(this)}
                          >
                            Descarcă imaginea preprocesată
                          </button>
                        </Accordion.Body>
                      </Accordion.Item>
                    </Accordion>
                  </Draggable>


                </div>

                <div className="col-4">

                  <Draggable>
                    <Accordion defaultActiveKey={["0"]} alwaysOpen>

                      <Accordion.Item eventKey="0">
                        <Accordion.Header>Textul recunoscut</Accordion.Header>
                        <Accordion.Body>
                          {this.state.ocrResults &&
                            this.state.ocrResults.map((item, index) => {
                              return (
                                <textarea
                                  key={index}
                                  id={index}
                                  /* onFocus={this.setActiveInput.bind(this)} */
                                  value={item}
                                  /* onChange={this.onChangeInput.bind(this)} */
                                  readOnly
                                  className="form-control_result mb-2 text-output"
                                  rows="10"
                                ></textarea>
                              );
                            })}
                          <button
                            type="button"
                            className="btn btn-link col-12"
                            onClick={this.save_ocr.bind(this)}
                          >
                            Descarcă în format .txt
                          </button>
                          <button
                            type="button"
                            className="btn btn-link col-12"
                            onClick={this.save_ocr_doc.bind(this)}
                          >
                            Descarcă în format .doc
                          </button>
                        </Accordion.Body>
                      </Accordion.Item>

                    </Accordion>
                  </Draggable>
                </div>

                <div className="col-4">
                  <Draggable>
                    <Accordion defaultActiveKey={["0"]} alwaysOpen>
                      <Accordion.Item eventKey="0">
                        <Accordion.Header>Text transliterat</Accordion.Header>
                        <Accordion.Body>
                          {this.state.transResults &&
                            this.state.transResults.map((item, index) => {
                              return (
                                <textarea
                                  key={index}
                                  id={index}
                                  /* onFocus={this.setActiveInput.bind(this)} */
                                  value={item}
                                  /* onChange={this.onChangeInput.bind(this)} */
                                  readOnly
                                  className="form-control_result mb-2 text-output"
                                  rows="10"
                                ></textarea>
                              );
                            })}
                          <button
                            type="button"
                            className="btn btn-link col-12"
                            onClick={this.save_trans.bind(this)}
                          >
                            Descarcă în format .txt
                          </button>
                          <button
                            type="button"
                            className="btn btn-link col-12"
                            onClick={this.save_trans_doc.bind(this)}
                          >
                            Descarcă în format .doc
                          </button>
                        </Accordion.Body>
                      </Accordion.Item>
                    </Accordion>
                  </Draggable>
                </div>

              </div>
            )}
            <div class="d-flex flex-row justify-content-center p-4 m-2 border gap-3 bg-light rounded">
              <button className="btn btn-primary" onClick={() => {
                this.props.jumpToStep(0); Object.getOwnPropertyNames(this.props.getStore()).forEach(function (prop) {
                  delete obj[prop];
                });
              }}>
                Digitizează un document nou
              </button>
              {this.props.getStore().sourceFiles.length > 0 &&
                <button className="btn btn-success" onClick={() => {
                  this.props.jumpToStep(0); Object.getOwnPropertyNames(this.props.getStore()).forEach(function (prop) {
                    delete obj[prop];
                  });
                }}>
                  Publică documentul digitizat
                </button>
              }
            </div>

          </form >
          {/* <div className="col-2 m-4">
            <button className="btn btn-secondary" onClick={() =>
              this.setState({ show: !this.state.show })
            }>Obiectul digitizat</button>
            {this.state.show && (JSON.stringify(this.props.getStore()))}
          </div> */}


        </div >

      </div >
    );
  }
}
