"use strict";

import React, { Component, useRef } from "react";
import PropTypes from "prop-types";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import layouts from "../components/KeyboardLayouts";
import RichTextEditor from "../components/RichTextEditor";
import { EditorState, ContentState, convertFromHTML } from "draft-js";
import Accordion from "react-bootstrap/Accordion";
import Button from "react-bootstrap/Button";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import StepsInfo from "../components/StepsInfo";
import Row from "react-bootstrap/esm/Row";
import Col from "react-bootstrap/esm/Col";
import { Spinner } from "react-bootstrap";
import Samples from "../components/Samples";

class Step4 extends Component {
  constructor(props) {
    super(props);

    this.state = {
      // ocrResults: Samples.cyrillic.ocrResults,
      ocrResults: props.getStore().ocrResults,
      sourceFiles: props.getStore().sourceFiles,
      s3SourceFiles: props.getStore().s3SourceFiles,
      preprocessedFiles: props.getStore().preprocessedFiles,
      s3PreprocessedFiles: props.getStore().s3PreprocessedFiles,
      layoutName: "default",
      showk: false,
      showNextStep: false,
      // input: ""
      inputID: 0,
    };
    // this.keyboard = React.createRef();
    this.API = this.props.getStore().api;

    this.cyrillicRomanianLayout = layouts[props.getStore().alphabet];

    /* this.state = {editorState: EditorState.createEmpty()};
    this.onChange = editorState => this.setState({editorState}); */

    /* console.log(this.setState()); */
    this.onChange = (editorState) => this.setState({ editorState });

    this.step4Info = (
      <Popover id="popover-basic">
        <Popover.Header as="h4">{StepsInfo.step4Info.title}</Popover.Header>
        <Popover.Body>
          <div dangerouslySetInnerHTML={{ __html: StepsInfo.step4Info.body }} />

        </Popover.Body>
      </Popover>
    );
  }

  componentDidMount() { }

  onChange = input => {

    this.state.ocrResults[this.state.inputID] = input;
    this.setState({ ocrResults: [...this.state.ocrResults] });

    console.log("Input changed", input);
  };

  onKeyPress = button => {
    console.log("Button pressed", button);

    /**
     * If you want to handle the shift and caps lock buttons
     */
    if (button === "{shift}" || button === "{lock}") this.handleShift();
  };


  handleShift() {
    const layoutName = this.state.layoutName;
    this.setState({
      layoutName: layoutName === "default" ? "shift" : "default",
    });
  }

  setActiveInput(event) {
    this.setState({ inputID: event.target.id });
    /* console.log(event.target.id); */
  }

  // onChangeInput(event) {
  //   const input = event.target.value;
  //   this.state.ocrResults[this.state.inputID] = input;
  //   this.setState({ ocrResults: [...this.state.ocrResults] });
  //   console.log(this.state.ocrResults);
  //   this.props.updateStore({ ocrResults: this.state.ocrResults });
  //   // this.keyboard.setInput(input);
  // }

  onChangeInput = event => {
    console.log(event.target.value, event.target.id);
    const input = event.target.value;
    this.state.ocrResults[this.state.inputID] = input;
    this.setState({ ocrResults: [...this.state.ocrResults] });
    this.keyboard.setInput(input);
  };

  handleKeyboardButton(showk) {
    const keyboardButton = document.querySelector("button#keyboard-button");
    if (keyboardButton) {
      if (showk) {
        keyboardButton.classList.remove("btn-primary");
        keyboardButton.classList.add("btn-keyboard");
        return "Închide tastatura virtuală";
      }
      keyboardButton.classList.remove("btn-keyboard");
      keyboardButton.classList.add("btn-primary");
    }
    return "Deschide tastatura virtuală";
  }

  handleSubmit() {
    this.setState({ showNextStep: true });
  }

  render() {
    // Fisierele sursa
    const handleFilePath = (filePath) => {
      if (filePath.length > 0) return this.API + filePath;
      //https://httpbin.org/post
      //http://127.0.0.1:8000/media/
      return "https://cdn.presslabs.com/wp-content/uploads/2018/10/upload-error.png";
    };
    return (
      <div className="step step4">
        <div className="row">
          <form id="Form" className="form-horizontal">
            <div className="form-group">
              <label className="control-label col-md-12 d-flex">
                <h1>Pasul 4: Verifică și editează textul recunoscut</h1>
                <OverlayTrigger
                  trigger="click"
                  rootClose
                  placement="right"
                  overlay={this.step4Info}
                >
                  <Button
                    type="button"
                    className="btn btn-info text-white mx-4"
                  >
                    Info
                  </Button>
                </OverlayTrigger>

              </label>
            </div>
            <div className="row mt-3">
              <div className="form-group col-md-12 content form-block-holder">
                <Accordion defaultActiveKey={0} alwaysOpen>
                  {/* <label className="control-label col-12"> */}
                  {this.state.ocrResults.length > 0 &&

                    this.state.ocrResults.map((item, index) => {
                      return (

                        <Accordion.Item eventKey={index} key={index}>
                          <Accordion.Header>
                            {`Rezultatul OCR pentru documentul ${this.state.sourceFiles[index].name}`}
                          </Accordion.Header>
                          <Accordion.Body>

                            <Row>

                              <Col sm={9}>
                                <textarea
                                  key={index}
                                  id={index}
                                  onFocus={this.setActiveInput.bind(this)}
                                  value={item}
                                  onChange={this.onChangeInput.bind(this)}
                                  className="form-control text"
                                  rows="12"
                                ></textarea>
                                {/* <Keyboard
                                  keyboardRef={r => (this.keyboard = r)}
                                  layoutName={this.state.layoutName}
                                  onChange={this.onChange}
                                  onKeyPress={this.onKeyPress}
                                /> */}
                              </Col>

                              <Col sm={3}>
                                <Col sm={12}>
                                  <button
                                    id="keyboard-button"
                                    className="btn btn-primary"
                                    type="button"
                                    title="Tastatura Virtuală"
                                    onClick={() => this.setState({ showk: !this.state.showk })}>
                                    {this.handleKeyboardButton(this.state.showk)}
                                  </button>
                                  <div className="mt-3">
                                    <a

                                      className=""
                                      data-fancybox="gallery_2"
                                      data-src={this.state.s3PreprocessedFiles[index]}
                                      data-caption='imagine procesată'
                                      key={index}
                                    >

                                      Compară rezultatul OCR cu imaginea sursă preprocesată:
                                      <img width="200" className="" src={this.state.s3PreprocessedFiles[index]}
                                      />
                                    </a>
                                  </div>

                                </Col>


                              </Col>



                            </Row>
                          </Accordion.Body>
                        </Accordion.Item>

                      );
                    })}
                </Accordion>


                {/* </label> */}

                {this.state.showk && (
                  <Keyboard
                    keyboardRef={(r) => (this.keyboard = r)}
                    layoutName={this.state.layoutName}
                    onChange={(inputs) =>
                      this.onChangeInput(inputs[0])
                      //.bind(this)
                    }
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
          </form>
        </div >

        <Row className="mt-2">
          <Col>
            <Button className="save-ocr  float-end" onClick={this.handleSubmit.bind(this)}>
              Salvează modificările
            </Button>
            <span className="text-muted mx-2 mt-2 float-end">Ai verificat textul? Dacă da atunci </span>

          </Col>
          <Col>
            {this.state.showNextStep && (<>
              {document.querySelector(".save-ocr").disabled = true}
              {" "}
              <Button
                variant="primary mx-4"
                onClick={() => this.props.jumpToStep(4)}>
                Mergi la pasul următor - transliterarea textului verificat
              </Button>
            </>)}
          </Col>
        </Row>
      </div >
    );
  }
}

export default Step4;
