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
import Exceptions from "../components/ExceptionDict";

import "../css/main.css";

export default class DigitizationSteps extends Component {
  constructor(props) {
    super(props);
    this.state = {};

    this.sampleStore = {
      // email: "",
      // gender: "",
      period: "secolulXX", //default is 20th century
      ocrModel: "",
      typography: "",
      alphabet: "cyrillic", //default is cyrillic
      savedToCloud: false,
      // uploadFolder: "C:\\Users\\bumbu\\OneDrive\\Desktop\\Projects\\PlatformaDigitizare\\backend\\media",
      uploadFolder: "https://a926-81-180-76-251.eu.ngrok.io/media/",
      sourceFiles: [{ "name": "5.jpg", "size": 1535454, "type": "image/jpeg", "lastModifiedDate": "2021-05-27T15:49:52.594Z", "uploadedDate": "2022-05-17T19:15:44.681Z", "percent": 100, "id": "1652814944681-0", "status": "removed", "previewUrl": "blob:http://localhost:8080/3a701ff3-27a9-47ff-9ca3-fc2ce6554e10", "width": 1305, "height": 1333 }],
      preprocessedFiles: [],
      preprocessWith: "",
      preprocessMode: "desktop",
      ocrResults: [],
      transResults: [],
      preprocessFR: {
        divideIntoPages: false,
        correctResolution: true,
        convertToBlackAndWhite: true,
        straightenTextLines: true,
        reduceNoise: true,
        correctPageOrientation: true,
      },
      preprocessOpenCV: {
        setResolution: true,
        resolution: 300,
        removeNoise: true,
      },
      preprocessScanTailor: {
        resolution: 600, //default is 600 --dpi=<number>  -- sets x and y dpi. default: 600 --dpi-x=<number> --dpi-y=<number> --output-dpi=<number>  -- sets x and y output dpi. default: 600 --output-dpi-x=<number> --output-dpi-y=<number>
        colorMode: "black_and_white", //default is black_and_white <black_and_white|color_grayscale|mixed>
        whiteMargins: false, //default is false
        despeckle: "normal", //default is normal <off|cautious|normal|aggressive>
        orientation: "none", //default is portrait <left|right|upsidedown|none>
        contentDetection: "normal", //default is normal <cautious|normal|aggressive>
        normalizeIllumination: false, //default: false
        threshold: 0, //n<0 thinner, n>0 thicker; default: 0
      },
      alphabetOptions: {
        cyrillic: "alfabetul chirilic sovietic",
        latin: "alfabetul românesc modern",
        cyrillicRomanian: "alfabetul chirilic românesc",
        transitionalRomanian: "alfabetul românesc de tranziție",
      },
      periodOptions: {
        secolulXX: "secolul XX",
        secolulXIX: "secolul XIX",
        secolulXVIII: "secolul XVIII",
        secolulXVII: "secolul XVII",
      },

      transOptions: {
        actualizeWordForm: true,
        replaceApostrophe: true,
        removeHyphen: true,
        removeDiacritics: false,
        correctTextWithGPT3: true,
        exceptions: Exceptions,


      },
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
        name: "2. Procesează imaginea",
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
        name: "3. Recunoaște textul",
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
        name: "4. Verifică textul recunoscut",
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
        name: "5. Transliterează textul",
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
        name: "6. Verifică textul transliterat",
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
        name: "7. Salvează rezultatele",
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
            nextTextOnFinalActionStep={"Salvează rezultatele"}
            // hocValidationAppliedTo={[3]}
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
