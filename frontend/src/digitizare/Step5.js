'use strict';

import React, { Component } from 'react';
import Form from 'react-bootstrap/Form';
import Accordion from 'react-bootstrap/Accordion';
import Button from 'react-bootstrap/Button';

// OCR
export default class Step5 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "a@a.com",
      period: props.getStore().period,
      typography: props.getStore().typography,
      preprocessedFiles: props.getStore().preprocessedFiles,
      alphabet: props.getStore().alphabet,
      sourceFiles: props.getStore().sourceFiles,
      ocrResults: props.getStore().ocrResults,
      transResults: props.getStore().transResults,
      transOptions: props.getStore().transOptions,
      show: true,
    };

    this.alphabetOptions = props.getStore().alphabetOptions;
    this.periodOptions = props.getStore().periodOptions;
  }

  componentDidMount() { }

  componentWillUnmount() { }



  handleFilePath(filePath) {
    if (filePath.length > 0) return 'http://127.0.0.1:8000/media/' + filePath;
    return "https://cdn.presslabs.com/wp-content/uploads/2018/10/upload-error.png";
  }

  // Preprocesare cu FineReader
  handleTransOptionsChange(e) {
    let newState = this.state.transOptions;
    newState[e.target.name] = e.target.checked;
    this.setState(newState);
    // this.props.updateStore({ transOptions: { ...this.state.transOptions, [e.target.name]: e.target.checked } });
  }


  render() {
    // explicit class assigning based on validation
    // let notValidClasses = {};

    const handleTransRequest = async () => {
      const transAPI = "http://127.0.0.1:8000/transliterate/";

      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.state)
      };
      const response = await fetch(transAPI, requestOptions);
      const data = await response.json();

      this.setState({ transResults: data.transResults });
      this.props.updateStore({ transResults: data.transResults });
      console.log(data);
      this.setState({ show: false });
    }


    return (
      <div className="step step3">
        <div className="row">
          <Form className="form-horizontal">
            <Form.Group>
              <label className="col-md-12 control-label">
                <h1>Pasul 5: Transliterarea textului obținut după editarea OCR </h1>
              </label>
            </Form.Group>

            <div className="row content">
              <div className="mb-3 col-md-12">
                <Form.Group >
                  <Form.Label>5.1 Perioada documentului este:
                    <span className='text-primary mx-2'>{this.periodOptions[this.state.period]}</span>
                  </Form.Label>
                  {/* <Form.Check
                    inline
                    label="Secolul XX"
                    name="group5"
                    type="radio"
                    id="radio1"
                    value="secolulXX"
                    checked={this.state.period === "secolulXX"}
                    onChange={() => { this.setState({ period: "secolulXX" }); this.props.updateStore({ period: "secolulXX" }); }}
                  />
                  <Form.Check
                    inline
                    label="Secolul XIX"
                    name="group5"
                    type="radio"
                    id="radio2"
                    value="secolulXIX"
                    checked={this.state.period === "secolulXIX"}
                    onChange={() => { this.setState({ period: "secolulXIX" }); this.props.updateStore({ period: "secolulXIX" }); }}
                  />
                  <Form.Check
                    inline
                    label="Secolul XVIII"
                    name="group5"
                    type="radio"
                    id="radio3"
                    value="secolulXVIII"
                    checked={this.state.period === "secolulXVIII"}
                    onChange={() => { this.setState({ period: "secolulXVIII" }); this.props.updateStore({ period: "secolulXVIII" }); }}

                  />
                  <Form.Check
                    inline
                    label="Secolul XVII"
                    name="group5"
                    type="radio"
                    id="radio4"
                    value="secolulXVII"
                    checked={this.state.period === "secolulXVII"}
                    onChange={() => { this.setState({ period: "secolulXVII" }); this.props.updateStore({ period: "secolulXVII" }); }}
                  /> */}
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>5.2 Alfabetul documentului este:
                    <span className='text-primary mx-2'>{this.alphabetOptions[this.state.alphabet]}</span>
                  </Form.Label>
                  {/* <Form.Check
                    label="Alfabetul chirilic sovietic"
                    name="group6"
                    type="checkbox"
                    id="radio11"
                    value="cyrillic"
                    checked={this.state.alphabet === "cyrillic"}
                    onChange={() => { this.setState({ alphabet: "cyrillic" }); this.props.updateStore({ alphabet: "cyrillic" }); }}
                  />

                  <Form.Check
                    label="Alfabetul românesc (latin)"
                    name="group6"
                    type="checkbox"
                    id="radio12"
                    value="latin"
                    checked={this.state.alphabet === "latin"}
                    onChange={() => { this.setState({ alphabet: "latin" }); this.props.updateStore({ alphabet: "latin" }); }}
                  /> */}
                </Form.Group>
                <Form.Group>
                  <Form.Label>5.3 Setări de transliterare:</Form.Label>
                  <Form.Check
                    label="Actualizează ortografia (gînd => gând)"
                    name="actualizeWordForm"
                    id="checkboxTrans1"
                    type="checkbox"
                    checked={this.state.transOptions.actualizeWordForm}
                    onChange={this.handleTransOptionsChange.bind(this)}
                  />
                  <Form.Check
                    label="Înlocuiește apostroful cu cratima (n’ar => n-ar)"
                    name="replaceApostrophe"
                    id="checkboxTrans2"
                    type="checkbox"
                    checked={this.state.transOptions.replaceApostrophe}
                    onChange={this.handleTransOptionsChange.bind(this)}
                  />
                  <Form.Check
                    label="Șterge cratima care desparte cuvântul de la sfârșit de rând"
                    name="removeHyphen"
                    id="checkboxTrans3"
                    type="checkbox"
                    checked={this.state.transOptions.removeHyphen}
                    onChange={this.handleTransOptionsChange.bind(this)}
                  />
                </Form.Group>
              </div>


              <div className="mt-5 mb-3 col-md-12 d-flex justify-content-center">
                {this.state.period && this.state.show ? <Button variant="primary" onClick={handleTransRequest}>Start Transliterare</Button> : <Button variant="primary" disabled>Start Transliterare</Button>}
                {!this.state.show && <> <Button variant="primary mx-4" onClick={() => this.props.jumpToStep(5)}>Verifică și editează rezultatul</Button> </>}
              </div>

            </div>
          </Form>
        </div>

        {/* preprocessed image and reognized text */}
        <div className="row">
          <div className="col-md-12 d-flex justify-content-around">
            <div className="col-sm">
              {this.state.ocrResults.length != 0 && <>
                <Accordion defaultActiveKey={['0']} alwaysOpen>
                  <Accordion.Item eventKey="0">
                    <Accordion.Header>Sursa - textul recunoscut și editat</Accordion.Header>
                    <Accordion.Body>
                      {
                        this.state.ocrResults.map((text, index) => (
                          <div className="ocrResult mb-4" key={index}>
                            <span className="ocrResultTitle text-info">{`Rezultatul OCR pentru imaginea ${index + 1}:`}</span>
                            <p key={index} alt="">{text}</p>
                          </div>
                        ))
                      }
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>
              </>}
            </div>

            <div className="col-sm">
              {this.state.transResults != 0 && <>
                <Accordion defaultActiveKey={['0']} alwaysOpen>
                  <Accordion.Item eventKey="0">
                    <Accordion.Header>Ținta - textul transliterat </Accordion.Header>
                    <Accordion.Body>
                      {
                        this.state.transResults.map((text, index) => (
                          <div className="transResult mb-4" key={index}>
                            <span className="transResultTitle text-info">{`Rezultatul OCR pentru imaginea ${index + 1}:`}</span>
                            <p key={index} alt="">{text}</p>
                          </div>
                        ))
                      }
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>
              </>}
            </div>
          </div>
        </div>


      </div>
    )
  }
}
