"use strict";

import React, { Component } from "react";
import StepZilla from "../components/StepZilla";
import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3 from "./Step3";
import Step4 from "./Step4";
import Step5 from "./Step5";
import Step6 from "./Step6";
import Step7 from "./Step7";

import "../css/main.css";

export default class DigitizationSteps extends Component {
  constructor(props) {
    super(props);
    this.state = {};

    this.sampleStore = {
      email: "",
      gender: "",
      savedToCloud: false,
      sourceFiles: [],
    };
  }

  componentDidMount() { }

  componentWillUnmount() { }

  getStore() {
    return this.sampleStore;
  }

  updateStore(update) {
    this.sampleStore = {
      ...this.sampleStore,
      ...update,
    };
  }

  render() {
    const steps = [
      {
        name: "1. Încarcă fișierele",
        component: (
          <Step1
            getStore={() => this.getStore()}
            updateStore={(u) => {
              this.updateStore(u);
            }}
          />
        ),
      },
      {
        name: "2. Preprocesează imaginea",
        component: (
          <Step2
            getStore={() => this.getStore()}
            updateStore={(u) => {
              this.updateStore(u);
            }}
          />
        ),
      },
      {
        name: "3. OCR",
        component: (
          <Step3
            getStore={() => this.getStore()}
            updateStore={(u) => {
              this.updateStore(u);
            }}
          />
        ),
      },
      {
        name: "4. Verifică OCR",
        component: (
          <Step4
            getStore={() => this.getStore()}
            updateStore={(u) => {
              this.updateStore(u);
            }}
          />
        ),
      },
      {
        name: "5. Transliterează",
        component: (
          <Step5
            getStore={() => this.getStore()}
            updateStore={(u) => {
              this.updateStore(u);
            }}
          />
        ),
      },
      {
        name: "6. Verifică transliterația",
        component: (
          <Step6
            getStore={() => this.getStore()}
            updateStore={(u) => {
              this.updateStore(u);
            }}
          />
        ),
      },
      {
        name: "7. Folosește rezultatele",
        component: (
          <Step7
            getStore={() => this.getStore()}
            updateStore={(u) => {
              this.updateStore(u);
            }}
          />
        ),
      },
    ];

    return (
      <div className="example">
        <div className="step-progress">
          <StepZilla
            steps={steps}
            preventEnterSubmission={true}
            nextTextOnFinalActionStep={"Save"}
            hocValidationAppliedTo={[3]}
            startAtStep={
              window.sessionStorage.getItem("step")
                ? parseFloat(window.sessionStorage.getItem("step"))
                : 0
            }
            onStepChange={(step) => window.sessionStorage.setItem("step", step)}
          />
        </div>
      </div>
    );
  }
}
