"use strict";

import React, { Component, useRef } from "react";
import PropTypes from "prop-types";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import layouts from "../components/KeyboardLayouts";

class Step4 extends Component {
  constructor(props) {
    super(props);

    this.state = {
      ocrResults: props.getStore().ocrResults,
      sourceFiles: props.getStore().sourceFiles,
      preprocessedFiles: props.getStore().preprocessedFiles,
      layoutName: "default",
      show: false,
      // input: ""
      inputID: 0,
    };
    // this.keyboard = React.createRef();

    this.cyrillicRomanianLayout = layouts[props.getStore().alphabet];
  }

  componentDidMount() { }

  onChange(e) {
    let newState = {};
    newState[e.target.name] = e.target.value;
    this.setState(newState);
  }

  onKeyPress(button) {
    if (button === "{shift}" || button === "{lock}") this.handleShift();
  }

  handleShift() {
    const layoutName = this.state.layoutName;
    this.setState({
      layoutName: layoutName === "default" ? "shift" : "default",
    });
  }

  setActiveInput(event) {
    this.setState({ inputID: event.target.id });
    console.log(event.target.id);
  }

  onChangeInput(event) {
    const input = event.target.value;
    this.state.ocrResults[this.state.inputID] = input;
    this.setState({ ocrResults: [...this.state.ocrResults] });
    console.log(this.state.ocrResults);
    this.props.updateStore({ ocrResults: this.state.ocrResults });
    this.keyboard.setInput(input);
  }

  onChangeKeyboardInput(input) {
    this.state.ocrResults[0] = input;
    this.setState({ ocrResults: [...this.state.ocrResults] });
    this.props.updateStore({ ocrResults: [...this.state.ocrResults] });
  }

  render() {
    // Fisierele sursa
    const handleFilePath = (filePath) => {
      if (filePath.length > 0) return "http://127.0.0.1:8000/media/" + filePath;
      //https://httpbin.org/post
      //http://127.0.0.1:8000/media/
      return "https://cdn.presslabs.com/wp-content/uploads/2018/10/upload-error.png";
    };
    return (
      <div className="step step4">
        <div className="row">
          <form id="Form" className="form-horizontal">
            <div className="form-group">
              <label className="control-label col-md-12 ">
                <h1>
                  Pasul 4: Verifică și editează rezultatul obținut după procesul
                  OCR
                </h1>
              </label>
            </div>
            <div className="row mt-3">
              <div className="form-group col-md-12 content form-block-holder">
                <label className="control-label col-12">
                  {this.state.ocrResults && <>
                    <div className="row mb-3">
                      <span className="ocrResultTitle text-info col-12">
                        {`Rezultatul OCR pentru imaginea 1:`}
                        <button
                          className="btn btn-keyboard col-1"
                          type="button"
                          title="Tatstatura Virtuală"
                          onClick={() =>
                            this.setState({ show: !this.state.show })
                          }
                        >
                          <svg
                            className="svg_keyboard"
                            viewBox="0 0 24 24"
                          >
                            <path
                              fill="currentColor"
                              d="M19,10H17V8H19M19,13H17V11H19M16,10H14V8H16M16,13H14V11H16M16,17H8V15H16M7,10H5V8H7M7,13H5V11H7M8,11H10V13H8M8,8H10V10H8M11,11H13V13H11M11,8H13V10H11M20,5H4C2.89,5 2,5.89 2,7V17A2,2 0 0,0 4,19H20A2,2 0 0,0 22,17V7C22,5.89 21.1,5 20,5Z"
                            />
                          </svg>
                        </button>
                      </span>
                    </div>
                    <textarea
                      onFocus={this.setActiveInput.bind(this)}
                      value={this.state.ocrResults[0]}
                      onChange={this.onChangeInput.bind(this)}
                      className="form-control mb-4"
                      rows="10"
                    ></textarea>
                    <a
                      className="image_ocr_a"
                      data-fancybox="gallery_2"
                      data-src={
                        this.state.preprocessedFiles[0] != undefined
                          ? handleFilePath(
                            this.state.preprocessedFiles[0]
                          )
                          : "https://prikolnye-kartinki.ru/img/picture/Sep/23/9d857169c84422fdaa28df62667a1467/5.jpg"
                      }
                      data-caption={"imagine preprocesată"}
                    >
                      <img
                        className="image_ocr"
                        src={
                          this.state.preprocessedFiles[0] != undefined
                            ? handleFilePath(
                              this.state.preprocessedFiles[0]
                            )
                            : "https://prikolnye-kartinki.ru/img/picture/Sep/23/9d857169c84422fdaa28df62667a1467/5.jpg"
                        }
                      />
                    </a>
                  </>
                  }
                </label>

                {this.state.show && (
                  <Keyboard
                    keyboardRef={(r) => (this.keyboard = r)}
                    layoutName={this.state.layoutName}
                    onChange={this.onChangeKeyboardInput.bind(this)}
                    onKeyPress={this.onKeyPress.bind(this)}
                    layout={this.cyrillicRomanianLayout.layout}
                  />
                )}
              </div>
              {/* <div className="form-group col-md-3 content form-block-image">
                
                {this.state.preprocessedFiles.map((src, index) => (
                  <a
                    className=""
                    data-fancybox="gallery_2"
                    data-src={handleFilePath(src)}
                    data-caption="imagine originală"
                    key={index}
                  >
                    <img
                      className="Accordion_image"
                      src={handleFilePath(src)}
                    />
                  </a>
                ))}
              </div> */}
            </div>
          </form >
        </div >
      </div >
    );
  }
}

export default Step4;
