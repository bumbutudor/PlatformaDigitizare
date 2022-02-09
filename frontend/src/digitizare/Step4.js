'use strict';

import React, { Component, useRef } from 'react';
import PropTypes from 'prop-types';
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import layouts from '../components/KeyboardLayouts';

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
    this.keyboard = React.createRef();

    this.cyrillicRomanianLayout = layouts[props.getStore().alphabet];
  }

  componentDidMount() { };

  onChange(e) {
    let newState = {};
    newState[e.target.name] = e.target.value;
    this.setState(newState);
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

  setActiveInput(event) {
    this.setState({ inputID: event.target.id });
    console.log(event.target.id);
  }

  onChangeInput(event) {
    const input = event.target.value;
    this.state.ocrResults[this.state.inputID] = input;
    this.setState({ ocrResults: [...this.state.ocrResults] });
    this.keyboard.setInput(input);
    console.log(input);
  };

  onChangeKeyboardInput(input) {
    // this.state.ocrResults[this.state.inputID] = input;
    // this.setState({ ocrResults: [...this.state.ocrResults] });
  }

  render() {
    // explicit class assigning based on validation
    // console.log(layouts);

    return (
      <div className="step step4">
        <div className="row">
          <form id="Form" className="form-horizontal">
            <div className="form-group">
              <label className="control-label col-md-12 ">
                <h1>Pasul 4: Verifică și editează rezultatul obținut după procesul OCR</h1>
              </label>
            </div>
            <div className="form-group col-md-12 content form-block-holder">
              <label className="control-label w-75">
                {this.state.ocrResults && this.state.ocrResults.map((item, index) => {
                  return (
                    <div key={index}>
                      <span className="ocrResultTitle text-info">{`Rezultatul OCR pentru imaginea ${index + 1}:`}</span>
                      <textarea
                        key={index}
                        id={index}
                        onFocus={this.setActiveInput.bind(this)}
                        value={item}
                        onChange={this.onChangeInput.bind(this)}
                        className="form-control" rows="20">
                      </textarea>

                    </div>
                  );
                })}
              </label>
              <button className='btn btn-primary' type='button' onClick={() => this.setState({ show: !this.state.show })}>Tatstatura Virtuală</button>
              {this.state.show &&
                <Keyboard
                  // value={this.state.ocrResults[this.state.inputID]}
                  keyboardRef={r => (this.keyboard = r)}
                  layoutName={this.state.layoutName}
                  onChange={this.onChangeKeyboardInput.bind(this)}
                  onKeyPress={this.onKeyPress.bind(this)}
                  layout={this.cyrillicRomanianLayout.layout}
                />}
            </div>
          </form>
        </div>
      </div>
    )
  }
}

export default Step4;
