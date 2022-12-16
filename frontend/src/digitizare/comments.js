// step 1 comments
/*
line 80
<div className="step step1">
        <div className="row">
          <form id="Form" className="form-horizontal">
            <div className="form-group">
              <label className="col-md-12 control-label">
                <h1>
                  Pasul 1: Incarcă imagini sau fișiere PDF
                </h1>
                <h3 className="info">
                  Fișierele pot fi de tipul: .jpg, .jpeg, .png, .tif, .pdf.
                  <a href="#" onClick={() => this.props.jumpToStep(1)}>
                    Hopa!
                  </a>
                </h3>
              </label>
              <FileUpload
                jumpToStep={(i) => this.props.jumpToStep(i)}
                getStore={() => this.props.getStore()}
                updateStore={(u) => {
                  this.props.updateStore(u);
                }}
              />
            </div>
          </form>
        </div>
      </div>

      */

// step 3 comments
// line 71
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


// line 81
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

// line 113
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

// line 181
{/* 
<Form.Check
    label="Model bazat pe alfabetul românesc (latin)"
    name="secolulXX"
    type="radio"
    id="radio12"
    value="latin"
    checked={this.state.ocrModel === "latin"}
    onChange={() => { this.setState({ ocrModel: "latin", alphabet: "latin", show: true }); this.props.updateStore({ ocrModel: "latin", alphabet: "latin" }); }}
/> */}


//step 5 comments
// line 122
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
// line 135
{/* <Form.Check
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
                /> */}

//step 7 comments
// line 269

{/* <div className="col-md-12 control-label">
                <div className="col-md-12 txt">
                  <div className="col-md-4">Data</div>
                  <div className="col-md-4">
                    {{JSON.stringify(this.props.getStore())}}
                    {JSON.stringify(preprocessedFiles)}
                    {console.log(preprocessedFiles)}
                  </div>
                </div>
                {<h2 className={savingCls}></h2>}
              </div> */}