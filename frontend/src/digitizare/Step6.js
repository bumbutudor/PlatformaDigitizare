'use strict';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import validation from 'react-validation-mixin';
import strategy from 'joi-validation-strategy';
import Joi from 'joi';
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";

class Step6 extends Component {
  constructor(props) {
    super(props);

    this.state = {
      transResults: props.getStore().transResults,
      sourceFiles: props.getStore().sourceFiles,
      preprocessedFiles: props.getStore().preprocessedFiles,
      emailEmergency: "john.smith@example.com",
      layoutName: "default",
      // input: ""
    };

    this.validatorTypes = {
      emailEmergency: Joi.string().required()
    };

    this.getValidatorData = this.getValidatorData.bind(this);
    this.renderHelpText = this.renderHelpText.bind(this);
    this.isValidated = this.isValidated.bind(this);
  }

  isValidated() {
    return new Promise((resolve, reject) => {
      this.props.validate((error) => {
        if (error) {
          reject(); // form contains errors
          return;
        }

        if (this.props.getStore().emailEmergency != this.getValidatorData().emailEmergency) { // only update store of something changed
          this.props.updateStore({
            ...this.getValidatorData(),
            savedToCloud: false // use this to notify step4 that some changes took place and prompt the user to save again
          });  // Update store here (this is just an example, in reality you will do it via redux or flux)
        }

        resolve(); // form is valid, fire action
      });
    });
  }

  getValidatorData() {
    return {
      emailEmergency: this.refs.emailEmergency.value,
    }
  };

  onChange(e) {
    let newState = {};
    newState[e.target.name] = e.target.value;
    this.setState(newState);
  }

  renderHelpText(message, id) {
    return (<div className="val-err-tooltip" key={id}><span>{message}</span></div>);
  };


  // editor
  onInputFromKeyboardChange(input) {
    this.setState({ input });
    console.log(input);
  }

  onKeyPress(button) {
    if (button === "{shift}" || button === "{lock}") this.handleShift();
  };

  handleShift() {
    const layoutName = this.state.layoutName;
    this.setState({
      layoutName: layoutName === "default" ? "shift" : "default"
    });
  };

  onChangeInput(event) {
    const input = event.target.value;
    this.setState({ input });
    this.keyboard.setInput(input);
    console.log(input);
  };

  render() {
    // explicit class assigning based on validation
    let notValidClasses = {};
    notValidClasses.emailEmergencyCls = this.props.isValid('emailEmergency') ?
      'no-error col-md-8' : 'has-error col-md-8';

    return (
      <div className="step step6">
        <div className="row">
          <form id="Form" className="form-horizontal">
            <div className="form-group">
              <label className="control-label col-md-12 ">
                <h1>Pasul 6: Verifică și editează rezultatul obținut după transliterare</h1>
              </label>
            </div>
            <div className="form-group col-md-12 content form-block-holder">
              <label className="control-label w-75">
                {this.state.transResults && this.state.transResults.map((item, index) => {
                  return (
                    <div key={index}>
                      <span className="ocrResultTitle text-info">{`Rezultatul OCR pentru imaginea ${index + 1}:`}</span>
                      <textarea key={index} value={item} onChange={this.on} className="form-control" rows="20"></textarea>

                    </div>
                  );
                })}
              </label>
              <Keyboard
                keyboardRef={r => (this.keyboard = r)}
                layoutName={this.state.layoutName}
                onChange={this.onInputFromKeyboardChange.bind(this)}
                onKeyPress={this.onKeyPress.bind(this)}
              />
            </div>
          </form>
        </div>
      </div>
    )
  }
}

Step6.propTypes = {
  errors: PropTypes.object,
  validate: PropTypes.func,
  isValid: PropTypes.func,
  handleValidation: PropTypes.func,
  getValidationMessages: PropTypes.func,
  clearValidations: PropTypes.func,
  getStore: PropTypes.func,
  updateStore: PropTypes.func
};

export default validation(strategy)(Step6);
