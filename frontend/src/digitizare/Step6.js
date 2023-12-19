"use strict";

import React, { Component } from "react";
import PropTypes from "prop-types";
import validation from "react-validation-mixin";
import strategy from "joi-validation-strategy";
import Joi from "joi";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import layouts from "../components/KeyboardLayouts";
import Row from "react-bootstrap/esm/Row";
import Col from "react-bootstrap/esm/Col";
import Accordion from "react-bootstrap/Accordion";
import Button from "react-bootstrap/Button";
import KeyboardIcon from "../components/KeyboardIcon";
import AddExceptionWidget from "../components/AddExceptionWidget";
import LatestExceptionsWidget from "../components/LatestExeptionsWidget";
import { getDictionary } from "../utils/ApiService";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import StepsInfo from "../components/StepsInfo";


class Step6 extends Component {
  constructor(props) {
    super(props);

    this.state = {
      transResults: props.getStore().transResults,
      sourceFiles: props.getStore().sourceFiles,
      preprocessedFiles: props.getStore().preprocessedFiles,
      layoutName: "default",
      s3PreprocessedFiles: props.getStore().s3PreprocessedFiles,
      s3SourceFiles: props.getStore().s3SourceFiles,
      period: props.getStore().period,

      show: false,
      showNextStep: false,
      // input: ""
      inputID: 0,
    };
    // this.keyboard = React.createRef();
    this.romanian = layouts["latin"];
    this.cyrillicRomanianLayout = layouts[props.getStore().alphabet];
    this.API = props.getStore().api;
    this.step6Info = (
      <Popover id="popover-basic">
        <Popover.Header as="h4">{StepsInfo.step6Info.title}</Popover.Header>
        <Popover.Body>
          <div dangerouslySetInnerHTML={{ __html: StepsInfo.step6Info.body }} />

        </Popover.Body>
      </Popover>
    );
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
    this.state.transResults[this.state.inputID] = input;
    this.setState({ transResults: [...this.state.transResults] });
    console.log(this.state.transResults);
    this.props.updateStore({ transResults: this.state.transResults });
    // this.keyboard.setInput(input);
  }

  onChangeKeyboardInput(input, a) {
    console.log(input, a);
    const inputID = this.state.inputID;
    const transResults = this.state.transResults;
    transResults[inputID] = input;
    this.setState({ transResults: [...transResults] });
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
      <div className="step step6">
        <div className="row">
          <form id="Form" className="form-horizontal">
            <div className="form-group">
              <label className="col-md-12 control-label d-flex form-label">
                <h1>
                  Pasul 6: Verifică și editează rezultatul obținut după transliterare
                </h1>
                <OverlayTrigger
                  trigger="click"
                  rootClose
                  placement="right"
                  overlay={this.step6Info}
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
                <label className="control-label col-12">
                  <Accordion defaultActiveKey={0} alwaysOpen>
                    {this.state.transResults &&
                      // use google translate to translate the transilterated  text

                      this.state.transResults.map((item, index) => {
                        return (
                          <Accordion.Item eventKey={index} key={index}>
                            <Accordion.Header>
                              {`Rezultatul transliterării documentului ${this.state.sourceFiles[index].name}`}
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
                                    rows="14"
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
                                      title="Tastatura virtuală"
                                    > <KeyboardIcon />
                                      Tastatura virtuală
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
                </label>

                {this.state.show && (
                  <Keyboard
                    keyboardRef={(r) => (this.keyboard = r)}
                    layoutName={this.state.layoutName}
                    onChange={(inputs) =>
                      this.onChangeKeyboardInput(
                        inputs,
                        this.state.transResults[this.state.inputID]
                      ).bind(this)
                    }
                    onKeyPress={this.onKeyPress.bind(this)}
                    layout={this.romanian.layout}
                  />
                )}
              </div>

            </div>
          </form>

        </div>
        <div className="exception-widget">
          <AddExceptionWidget period={this.state.period} onGetDictionary={getDictionary} />
          {/* <span className="text-muted">Ultimele excepții adăugate</span>
          <LatestExceptionsWidget period={this.state.period} getDictionary={getDictionary} numberOfExceptionsToShow={7} /> */}
        </div>


        <Row className="mt-2">
          <Col>
            <Button className="save-trans float-end" onClick={this.handleSubmit.bind(this)}>
              Salvează modificările
            </Button>
          </Col>
          <Col>
            {this.state.showNextStep && (<>
              {document.querySelector(".save-trans").disabled = true}
              {" "}
              <Button
                variant="primary mx-4"
                onClick={() => this.props.jumpToStep(6)}>
                Mergi la pasul următor - salvează rezultatele finale
              </Button>
            </>)}
          </Col>
        </Row>
      </div>
    );
  }
}

export default Step6;
