'use strict';

import React, { Component } from 'react';
import Form from 'react-bootstrap/Form';
import Accordion from 'react-bootstrap/Accordion';
import Button from 'react-bootstrap/Button';

// OCR
export default class Step3 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: props.getStore().email,
      period: props.getStore().period,
      typography: props.getStore().typography,
      preprocessedFiles: props.getStore().preprocessedFiles,
      alphabet: props.getStore().alphabet,
      sourceFiles: props.getStore().sourceFiles,
      ocrResults: props.getStore().ocrResults,
      show: true,
    };


    // this._validateOnDemand = true; // this flag enables onBlur validation as user fills forms

    // this.validationCheck = this.validationCheck.bind(this);
    // this.isValidated = this.isValidated.bind(this);
  }

  handleFilePath(filePath) {
    if (filePath.length > 0) return 'http://127.0.0.1:8000/media/' + filePath;
    return "https://cdn.presslabs.com/wp-content/uploads/2018/10/upload-error.png";
  }

  componentDidMount() { }

  componentWillUnmount() { }

  // isValidated() {
  //   const userInput = this._grabUserInput(); // grab user entered vals
  //   const validateNewInput = this._validateData(userInput); // run the new input against the validator
  //   let isDataValid = false;

  //   // if full validation passes then save to store and pass as valid
  //   if (Object.keys(validateNewInput).every((k) => { return validateNewInput[k] === true })) {
  //     if (this.props.getStore().email != userInput.email || this.props.getStore().period != userInput.period) { // only update store of something changed
  //       this.props.updateStore({
  //         ...userInput,
  //         savedToCloud: false // use this to notify step4 that some changes took place and prompt the user to save again
  //       });  // Update store here (this is just an example, in reality you will do it via redux or flux)
  //     }

  //     isDataValid = true;
  //   }
  //   else {
  //     // if anything fails then update the UI validation state but NOT the UI Data State
  //     this.setState(Object.assign(userInput, validateNewInput, this._validationErrors(validateNewInput)));
  //   }

  //   return isDataValid;
  // }

  validationCheck() {
    if (!this._validateOnDemand)
      return;

    const userInput = this._grabUserInput(); // grab user entered vals
    const validateNewInput = this._validateData(userInput); // run the new input against the validator

    this.setState(Object.assign(userInput, validateNewInput, this._validationErrors(validateNewInput)));
  }

  // _validateData(data) {
  //   return {
  //     periodVal: (data.period != 0), // required: anything besides N/A
  //     emailVal: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(data.email), // required: regex w3c uses in html5
  //   }
  // }

  // _validationErrors(val) {
  //   const errMsgs = {
  //     periodValMsg: val.periodVal ? '' : 'A period selection is required',
  //     emailValMsg: val.emailVal ? '' : 'A valid email is required'
  //   }
  //   return errMsgs;
  // }

  // _grabUserInput() {
  //   return {
  //     period: this.refs.period.value,
  //     email: this.refs.email.value
  //   };
  // }


  render() {
    // explicit class assigning based on validation
    // let notValidClasses = {};

    const handleOCRRequest = async () => {
      const ocrAPI = "http://127.0.0.1:8000/ocr/";

      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.state)
      };
      const response = await fetch(ocrAPI, requestOptions);
      const data = await response.json();

      this.setState({ ocrResults: data.ocrResults });
      this.props.updateStore({ ocrResults: data.ocrResults });
      console.log(data);
      this.setState({ show: false });
    }

    // if (typeof this.state.periodVal == 'undefined' || this.state.periodVal) {
    //   notValidClasses.periodCls = 'no-error col-md-8';
    // }
    // else {
    //   notValidClasses.periodCls = 'has-error col-md-8';
    //   notValidClasses.periodValGrpCls = 'val-err-tooltip';
    // }

    // if (typeof this.state.emailVal == 'undefined' || this.state.emailVal) {
    //   notValidClasses.emailCls = 'no-error col-md-8';
    // }
    // else {
    //   notValidClasses.emailCls = 'has-error col-md-8';
    //   notValidClasses.emailValGrpCls = 'val-err-tooltip';
    // }
    return (
      <div className="step step3">
        <div className="row">
          <Form className="form-horizontal">
            <Form.Group>
              <label className="col-md-12 control-label">
                <h1>Pasul 3: Recunoașterea optică a caracterelor - OCR </h1>
              </label>
            </Form.Group>

            <div className="row content">
              <Form.Group className="mb-3 col-sm">
                <Form.Label>3.1 Selectează perioada documentului:</Form.Label>
                <Form.Check
                  label="Secolul XX"
                  name="group5"
                  type="radio"
                  id="radio1"
                  value="secolulXX"
                  checked={this.state.period === "secolulXX"}
                  onChange={() => { this.setState({ period: "secolulXX" }); this.props.updateStore({ period: "secolulXX" }); }}
                />
                <Form.Check
                  label="Secolul XIX"
                  name="group5"
                  type="radio"
                  id="radio2"
                  value="secolulXIX"
                  checked={this.state.period === "secolulXIX"}
                  onChange={() => { this.setState({ period: "secolulXIX" }); this.props.updateStore({ period: "secolulXIX" }); }}
                />
                <Form.Check
                  label="Secolul XVIII"
                  name="group5"
                  type="radio"
                  id="radio3"
                  value="secolulXVIII"
                  checked={this.state.period === "secolulXVIII"}
                  onChange={() => { this.setState({ period: "secolulXVIII" }); this.props.updateStore({ period: "secolulXVIII" }); }}

                />
                <Form.Check
                  label="Secolul XVII"
                  name="group5"
                  type="radio"
                  id="radio4"
                  value="secolulXVII"
                  checked={this.state.period === "secolulXVII"}
                  onChange={() => { this.setState({ period: "secolulXVII", alphabet: "cyrillicRomanian" }); this.props.updateStore({ period: "secolulXVII", alphabet: "cyrillicRomanian" }); }}
                />
              </Form.Group>
              <div className="col-sm mb-3">
                {this.state.period === "secolulXX" && <>
                  <Form.Group className="mb-3">
                    <Form.Label>3.2 Selectează alfabetul documentului:</Form.Label>
                    <Form.Check
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
                    />
                  </Form.Group>

                </>}
                {this.state.period === "secolulXIX" && <>TODO</>}
                {this.state.period === "secolulXVIII" && <>TODO</>}
                {this.state.period === "secolulXVII" && <>
                  <Form.Group className="">
                    <Form.Label>3.2 Selectează tipografia din Secolul XVII</Form.Label>
                    <Form.Select value={this.state.typography} onChange={(e) => { this.setState({ typography: e.target.value }); this.props.updateStore({ typography: e.target.value }); }}>

                      <option value="">Lista tipografiilor:</option>
                      <option value="typography1">Tipariul cel Domnesc (Iași)</option>
                      <option value="typography2">Casa Sfintei Mitropolii (Iași)</option>
                      <option value="typography3">Tiparnița Tărâi (Iași)</option>
                      <option value="typography4">Scaunul Mitropolii Bucureștilor (București)</option>
                      <option value="typography5">Tipografia Domnească (Belgrad)</option>
                      <option value="typography6">Mitropolia Belgradului (Belgrad)</option>
                      <option value="typography7">Sfânta Mitropolie a Târgoviştii (Târgoviște)</option>
                      <option value="typography8">Sfînta Mănăstire Uniev (Uniev)</option>
                      <option value="typography9">Tipograf[ia] Noao (Sas Sebeș)</option>
                      <option value="typography10">Tipografiia Domnească în Sfânta Mănăstire în Snagov (Snagov )</option>
                      <option value="typography11">Tipografiia Domnească, la Episcupiia dela Buzău (Buzău)</option>

                    </Form.Select>
                    <span className='m-2' />
                    <Form.Check
                      label="Identifică automat fontul documentului"
                      name="group7"
                      type="checkbox"
                      id="radio5"
                      value="typographyAuto"
                      checked={this.state.typography === "typographyAuto"}
                      onChange={() => { this.setState({ typography: "typographyAuto" }); this.props.updateStore({ typography: "typographyAuto" }); }}

                    />
                    <Form.Check
                      disabled
                      label="Alfabetul chirilic românesc"
                      name="group6"
                      type="checkbox"
                      id="radio13"
                      value="cyrillicRomanian"
                      checked={this.state.alphabet === "cyrillicRomanian"}
                      onChange={() => { this.setState({ alphabet: "cyrillicRomanian" }); this.props.updateStore({ alphabet: "cyrillicRomanian" }); }}
                    />
                  </Form.Group>
                </>}
              </div>


              <div className="mt-5 mb-3 col-md-12 d-flex justify-content-center">
                {this.state.period && this.state.show ? <Button variant="primary" onClick={handleOCRRequest}>Start OCR</Button> : <Button variant="primary" disabled>Start OCR</Button>}
                {!this.state.show && <> <Button variant="primary mx-4" onClick={() => this.props.jumpToStep(3)}>Verifică și editează rezultatul</Button> </>}
              </div>

            </div>
          </Form>
        </div>

        {/* preprocessed image and reognized text */}
        <div className="row">
          <div className="col-md-12 d-flex justify-content-around">
            <div className="col-sm">
              {this.state.sourceFiles.length != 0 && <>
                <Accordion defaultActiveKey={['0']} alwaysOpen>
                  <Accordion.Item eventKey="0">
                    <Accordion.Header>Sursa - imagine preprocesată</Accordion.Header>
                    <Accordion.Body>
                      {
                        this.state.preprocessedFiles.map((src, index) => (
                          <div key={index} className="preprocessedFile mb-2">
                            <span className="ocrResultTitle text-info">{`Imaginea ${index + 1}:`}</span>
                            <img
                              src={this.handleFilePath(src)}
                              onClick={() => openImageViewer(index)}
                              width="90%"
                              key={index}
                              alt="" />
                          </div>
                        ))
                      }
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>
              </>}
            </div>

            <div className="col-sm">
              {this.state.ocrResults != 0 && <>
                <Accordion defaultActiveKey={['0']} alwaysOpen>
                  <Accordion.Item eventKey="0">
                    <Accordion.Header>Ținta - rezultatul OCR </Accordion.Header>
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
          </div>
        </div>


      </div>
    )
  }
}
