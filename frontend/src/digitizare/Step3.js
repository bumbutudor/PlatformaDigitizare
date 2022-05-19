'use strict';

import React, { Component } from 'react';
import Form from 'react-bootstrap/Form';
import Accordion from 'react-bootstrap/Accordion';
import Button from 'react-bootstrap/Button';
import StepsInfo from '../components/StepsInfo';
import Popover from "react-bootstrap/Popover";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import FetchWrapper from '../components/FetchWrapper';
import Spinner from "react-bootstrap/Spinner";
import Alert from 'react-bootstrap/Alert'

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
      ocrModel: props.getStore().ocrModel,
      ocrResults: props.getStore().ocrResults,
      show: false,
      showLoader: false,
      showNextStep: false,
      showErroe: false,
      // TODO
      // const [show, setShow] = React.useState(true);
      // const [showLoader, setShowLoader] = React.useState(false);
      // const [showNextStep, setShowNextStep] = React.useState(false);
      // const [showError, setShowError] = React.useState(false);
    };

    this.step3Info = (
      <Popover id="popover-basic">
        <Popover.Header as="h4">TODO</Popover.Header>
        <Popover.Body>
          TODO
        </Popover.Body>
      </Popover>

    );
    this.API = new FetchWrapper('http://localhost:8000/');

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

  async handleOCRRequest() {
    this.setState({ show: false });
    this.setState({ showError: false });
    this.setState({ showLoader: true });

    const ocrEndpoint = "ocr/";
    const postData = this.state;

    this.API.post(ocrEndpoint, postData)
      .then(data => {
        console.log(data);
        if (data.ocrResults.length > 0) {
          this.setState({ ocrResults: data.ocrResults });
          this.props.updateStore({ ocrResults: data.ocrResults });
          this.setState({ showNextStep: true });
        } else {
          this.setState({ showError: true });
        }
      })
      .catch(error => {
        console.log(error);
        this.setState({ showError: true });
      })
      .finally(() => {
        this.setState({ showLoader: false });
      });
  }


  render() {
    // explicit class assigning based on validation
    // let notValidClasses = {};

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
              <Form.Label className="col-md-12 control-label d-flex">
                <h1>Pasul 3: Recunoașterea optică a caracterelor - OCR </h1>
                <OverlayTrigger trigger="click" rootClose placement="right" overlay={this.step3Info}>
                  <Button type="button" className="btn btn-info text-white mx-4">Info</Button>
                </OverlayTrigger>
              </Form.Label>
            </Form.Group>

            <div className="row content">
              <Form.Group className="mb-3 col-sm-3 border">
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
                  onChange={() => { this.setState({ period: "secolulXVIII", alphabet: "cyrillicRomanian" }); this.props.updateStore({ period: "secolulXVIII", alphabet: "cyrillicRomanian" }); }}

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
                    <Form.Label>3.2 Selectează modelul OCR cel mai apropriat de documetul tău:</Form.Label>
                    <Form.Check
                      label="Model bazat pe alfabetul chirilic sovietic"
                      name="secolulXX"
                      // type="checkbox"
                      type='radio'
                      id="radio11"
                      value="cyrillic"
                      checked={this.state.ocrModel === "cyrillic"}
                      onChange={() => { this.setState({ ocrModel: "cyrillic", alphabet: "cyrillic", show: true }); this.props.updateStore({ ocrModel: "cyrillic", alphabet: "cyrillic" }); }}
                    />

                    <Form.Check
                      label="Model bazat pe alfabetul românesc (latin)"
                      name="secolulXX"
                      type="radio"
                      id="radio12"
                      value="latin"
                      checked={this.state.ocrModel === "latin"}
                      onChange={() => { this.setState({ ocrModel: "latin", alphabet: "latin", show: true }); this.props.updateStore({ ocrModel: "latin", alphabet: "latin" }); }}
                    />
                  </Form.Group>

                </>}
                {this.state.period === "secolulXIX" && <>
                  <Form.Group className="mb-3 col-sm">
                    <Form.Label>3.2 Selectează modelul OCR cel mai apropriat de documetul tău:</Form.Label>
                    <Form.Check
                      label="Model bazat alfabetul chirilic românesc (Legiuire de G. Caragea, anul 1818)"
                      name="secolulXIX"
                      type="radio"
                      id="radio21"
                      value="secolulXIX_1"
                      checked={this.state.ocrModel === "secolulXIX_1"}
                      onChange={() => { this.setState({ ocrModel: "secolulXIX_1", alphabet: "cyrillicRomanian", show: true }); this.props.updateStore({ ocrModel: "secolulXIX_1", alphabet: "cyrillicRomanian" }); }}
                    />
                    <Form.Check
                      label="Model bazat pe alfabetul de tranziție (Epistolariul românesc, anul 1841)"
                      name="secolulXIX"
                      type="radio"
                      id="radio22"
                      value="secolulXIX_2"
                      checked={this.state.ocrModel === "secolulXIX_2"}
                      onChange={() => { this.setState({ ocrModel: "secolulXIX_2", alphabet: "cyrillicTransitional", show: true }); this.props.updateStore({ ocrModel: "secolulXIX_2", alphabet: "cyrillicTransitional" }); }}
                    />
                    <Form.Check
                      label="Model bazat pe alfabetul de tranziție (Elemente de aritmetică de G. Asachi, anul 1836)"
                      name="secolulXIX"
                      type="radio"
                      id="radio23"
                      value="secolulXIX_3"
                      checked={this.state.ocrModel === "secolulXIX_3"}
                      onChange={() => { this.setState({ ocrModel: "secolulXIX_3", alphabet: "cyrillicTransitional", show: true }); this.props.updateStore({ ocrModel: "secolulXIX_3", alphabet: "cyrillicTransitional" }); }}

                    />
                  </Form.Group>

                </>}
                {this.state.period === "secolulXVIII" && <>
                  <Form.Group className="mb-3 col-sm">
                    <Form.Label>3.2 Selectează modelul OCR cel mai apropriat de documetul tău:</Form.Label>
                    <Form.Check
                      label="Model bazat pe alfabetul chirilic românesc&nbsp;&nbsp;&nbsp; (De Obște Geografie, anul 1795)"
                      name="secolulXVIII"
                      type="radio"
                      id="radio31"
                      value="secolulXVIII_1"
                      checked={this.state.ocrModel === "secolulXVIII_1"}
                      onChange={() => { this.setState({ ocrModel: "secolulXVIII_1", show: true }); this.props.updateStore({ ocrModel: "secolulXVIII_1" }); }}
                    />
                    <Form.Check
                      label="Model bazat pe alfabetul chirilic românesc (Fiziognomie de M. Strilbițchi, anul 1785)"
                      name="secolulXVIII"
                      type="radio"
                      id="radio32"
                      value="secolulXVIII_2"
                      checked={this.state.ocrModel === "secolulXVIII_2"}
                      onChange={() => { this.setState({ ocrModel: "secolulXVIII_2", show: true }); this.props.updateStore({ ocrModel: "secolulXVIII_2" }); }}
                    />
                    <Form.Check
                      label="Model bazat pe alfabetul chirilic românesc (Așezământ, anul 1786)"
                      name="secolulXVIII"
                      type="radio"
                      id="radio33"
                      value="secolulXVIII_3"
                      checked={this.state.ocrModel === "secolulXVIII_3"}
                      onChange={() => { this.setState({ ocrModel: "secolulXVIII_3", show: true }); this.props.updateStore({ ocrModel: "secolulXVIII_3" }); }}

                    />
                  </Form.Group>

                </>}
                {this.state.period === "secolulXVII" && <>
                  <Form.Group className="mb-4">
                    <Form.Label>3.2 Selectează modelul OCR cel mai apropriat de documetul tău:</Form.Label>
                    <Form.Check
                      {...(this.state.typography === "typographyAuto" ? { disabled: true } : {})}
                      label="Model bazat pe alfabetul chirilic românesc (Noul Testament, 1646, clasa A de fonturi)"
                      name="secolulXVII"
                      type="radio"
                      id="radio41"
                      value="secolulXVII_1"
                      checked={this.state.ocrModel === "secolulXVII_1"}
                      onChange={() => { this.setState({ alphabet: "cyrillicRomanian", ocrModel: "secolulXVII_1", show: true }); this.props.updateStore({ alphabet: "cyrillicRomanian", ocrModel: "secolulXVII_1" }); }}
                    />
                    <Form.Check
                      {...(this.state.typography === "typographyAuto" ? { disabled: true } : {})}
                      label="Model bazat pe alfabetul chirilic românesc (antrenat cu fonturile de tip B)"
                      name="secolulXVII"
                      type="radio"
                      id="radio42"
                      value="secolulXVII_2"
                      checked={this.state.ocrModel === "secolulXVII_2"}
                      onChange={() => { this.setState({ alphabet: "cyrillicRomanian", ocrModel: "secolulXVII_2", show: true }); this.props.updateStore({ alphabet: "cyrillicRomanian", ocrModel: "secolulXVII_2" }); }}
                    />

                  </Form.Group>
                  <Form.Group className="mb-4">
                    <Form.Check
                      label="Identifică automat modelul necesar pentru documentul tău"
                      name="typographyAuto"
                      type="checkbox"
                      id="radio43"
                      value="typographyAuto"
                      checked={this.state.typography === "typographyAuto"}
                      onChange={() => { this.setState({ typography: "typographyAuto", show: true }); this.props.updateStore({ typography: "typographyAuto" }); }}

                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label>Dacă cunoști la ce tipografie a fost tipărit documentul, selectează din lista de mai jos </Form.Label>
                    <Form.Select value={this.state.typography} onChange={(e) => { this.setState({ typography: e.target.value, show: true }); this.props.updateStore({ typography: e.target.value }); }}>

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
                  </Form.Group>
                </>}
              </div>


              <div className="mt-2 mb-3 col-md-12 d-flex justify-content-center">
                {this.state.period && this.state.show ?
                  <Button
                    variant="primary"
                    onClick={this.handleOCRRequest.bind(this)}>
                    Start OCR
                  </Button> :
                  <Button
                    variant="primary"
                    disabled>
                    {this.state.showLoader ?
                      (<>
                        <Spinner
                          animation="border" />
                        Are loc procesul OCR...
                      </>) :
                      (<>
                        Start OCR
                      </>)}</Button>}

                {this.state.showNextStep && (<>
                  {" "}
                  <Button
                    variant="primary mx-4"
                    onClick={() => this.props.jumpToStep(3)}>
                    Mergi la pasul următor
                  </Button>
                </>)}
              </div>
              {this.state.showError && (
                <Alert variant="danger">
                  <Alert.Heading>Eroare la recunoașterea optică! Incearcă alt model OCR...</Alert.Heading>
                </Alert>
              )}
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
