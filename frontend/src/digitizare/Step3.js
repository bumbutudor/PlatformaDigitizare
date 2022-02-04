'use strict';

import React, { Component } from 'react';
import Form from 'react-bootstrap/Form';

export default class Step3 extends Component {
  constructor(props) {
    super(props);

    this.state = {
      email: props.getStore().email,
      period: props.getStore().period,
      preprocessedFiles: props.getStore().preprocessedFiles
    };


    this._validateOnDemand = true; // this flag enables onBlur validation as user fills forms

    this.validationCheck = this.validationCheck.bind(this);
    this.isValidated = this.isValidated.bind(this);
  }

  componentDidMount() { }

  componentWillUnmount() { }

  isValidated() {
    const userInput = this._grabUserInput(); // grab user entered vals
    const validateNewInput = this._validateData(userInput); // run the new input against the validator
    let isDataValid = false;

    // if full validation passes then save to store and pass as valid
    if (Object.keys(validateNewInput).every((k) => { return validateNewInput[k] === true })) {
      if (this.props.getStore().email != userInput.email || this.props.getStore().period != userInput.period) { // only update store of something changed
        this.props.updateStore({
          ...userInput,
          savedToCloud: false // use this to notify step4 that some changes took place and prompt the user to save again
        });  // Update store here (this is just an example, in reality you will do it via redux or flux)
      }

      isDataValid = true;
    }
    else {
      // if anything fails then update the UI validation state but NOT the UI Data State
      this.setState(Object.assign(userInput, validateNewInput, this._validationErrors(validateNewInput)));
    }

    return isDataValid;
  }

  validationCheck() {
    if (!this._validateOnDemand)
      return;

    const userInput = this._grabUserInput(); // grab user entered vals
    const validateNewInput = this._validateData(userInput); // run the new input against the validator

    this.setState(Object.assign(userInput, validateNewInput, this._validationErrors(validateNewInput)));
  }

  _validateData(data) {
    return {
      periodVal: (data.period != 0), // required: anything besides N/A
      emailVal: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(data.email), // required: regex w3c uses in html5
    }
  }

  _validationErrors(val) {
    const errMsgs = {
      periodValMsg: val.periodVal ? '' : 'A period selection is required',
      emailValMsg: val.emailVal ? '' : 'A valid email is required'
    }
    return errMsgs;
  }

  _grabUserInput() {
    return {
      period: this.refs.period.value,
      email: this.refs.email.value
    };
  }

  render() {
    // explicit class assigning based on validation
    let notValidClasses = {};

    if (typeof this.state.periodVal == 'undefined' || this.state.periodVal) {
      notValidClasses.periodCls = 'no-error col-md-8';
    }
    else {
      notValidClasses.periodCls = 'has-error col-md-8';
      notValidClasses.periodValGrpCls = 'val-err-tooltip';
    }

    if (typeof this.state.emailVal == 'undefined' || this.state.emailVal) {
      notValidClasses.emailCls = 'no-error col-md-8';
    }
    else {
      notValidClasses.emailCls = 'has-error col-md-8';
      notValidClasses.emailValGrpCls = 'val-err-tooltip';
    }
    console.log(this.props.getStore());
    return (
      <div className="step step3">
        <div className="row">
          <Form className="form-horizontal">
            <Form.Group>
              <label className="col-md-12 control-label">
                <h1>Pasul 3: Recunoașterea optică a caracterelor din imagine </h1>
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
                  checked={this.state.period == "secolulXX"}
                  onChange={() => { this.setState({ period: "secolulXX" }); this.props.updateStore({ period: "secolulXX" }); }}
                />
                <Form.Check
                  label="Secolul XIX"
                  name="group5"
                  type="radio"
                  id="radio2"
                  value="secolulXIX"
                  checked={this.state.period == "secolulXIX"}
                  onChange={() => { this.setState({ period: "secolulXIX" }); this.props.updateStore({ period: "secolulXIX" }); }}
                />
                <Form.Check
                  label="Secolul XVIII"
                  name="group5"
                  type="radio"
                  id="radio3"
                  value="secolulXVIII"
                  checked={this.state.period == "secolulXVIII"}
                  onChange={() => { this.setState({ period: "secolulXVIII" }); this.props.updateStore({ period: "secolulXVIII" }); }}

                />
                <Form.Check
                  label="Secolul XVII"
                  name="group5"
                  type="radio"
                  id="radio4"
                  value="secolulXVII"
                  checked={this.state.period == "secolulXVII"}
                  onChange={() => { this.setState({ period: "secolulXVII" }); this.props.updateStore({ period: "secolulXVII" }); }}
                />
              </Form.Group>
              <div className="col-md-12">
                <div className="form-group col-md-12 content form-block-holder">
                  <label className="control-label col-md-4">
                    Perioada cand a fost tiparită:
                  </label>
                  <div className={notValidClasses.periodCls}>
                    <select
                      ref="period"
                      autoComplete="off"
                      className="form-control"
                      required
                      defaultValue={this.state.period}
                      onBlur={this.validationCheck}>
                      <option value="">Selectează perioada:</option>
                      <option value="secolulXX">Secolul XX</option>
                      <option value="secolulXIX">Secolul XIX</option>
                      <option value="secolulXVIII">Secolul XVIII</option>
                      <option value="secolulXVII">Secolul XVII</option>
                    </select>
                    <div className={notValidClasses.periodValGrpCls}>{this.state.periodValMsg}</div>
                  </div>
                </div>
              </div>

            </div>

            <div className="form-group col-md-12 content form-block-holder">
              <label className="control-label col-md-4">
                Email
              </label>
              <div className={notValidClasses.emailCls}>
                <input
                  ref="email"
                  autoComplete="off"
                  type="email"
                  placeholder="john.smith@example.com"
                  className="form-control"
                  required
                  defaultValue={this.state.email}
                  onBlur={this.validationCheck} />
                <div className={notValidClasses.emailValGrpCls}>{this.state.emailValMsg}</div>
              </div>
            </div>
          </Form>
        </div>
      </div>
    )
  }
}
