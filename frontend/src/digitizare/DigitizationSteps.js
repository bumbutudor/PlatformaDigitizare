"use strict";

import React, { Component } from "react";
import StepZilla from "../components/main";
import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3 from "./Step3";
import Step4 from "./Step4";
import Step5 from "./Step5";
import Step6 from "./Step6";
import Step7 from "./Step7";
import Exceptions from "../components/ExceptionDict";
import Form from "react-bootstrap/Form";
import ServiceStatus from "../utils/ServiceStatus";
import ServiceStatusBadge from "../components/ServiceStatusBadge";
import { apiUrl, getApiBaseUrl } from "../utils/ApiConfig";
import { SCANTAILOR_DEFAULT_OPTIONS } from "../utils/ScanTailorConfig";

import "../css/main.css";

export default class DigitizationSteps extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    const api = getApiBaseUrl();

    this.sampleStore = {
      // email: "",
      // gender: "",
      api,
      period: "secolulXX", //default is 20th century
      ocrModel: "",
      typography: "",
      alphabet: "cyrillic", //default is cyrillic
      saveToCloud: true,
      savedToCloud: false,
      // uploadFolder: "C:\\Users\\bumbu\\OneDrive\\Desktop\\Projects\\PlatformaDigitizare\\backend\\media",
      uploadFolder: apiUrl("media/", api),
      sourceFiles: [{ "name": "5.jpg", "size": 1535454, "type": "image/jpeg", "lastModifiedDate": "2021-05-27T15:49:52.594Z", "uploadedDate": "2022-05-17T19:15:44.681Z", "percent": 100, "id": "1652814944681-0", "status": "removed", "previewUrl": "blob:http://localhost:8080/3a701ff3-27a9-47ff-9ca3-fc2ce6554e10", "width": 1305, "height": 1333 }],
      s3SourceFiles: [],
      preprocessedFiles: [],
      s3PreprocessedFiles: [],
      preprocessWith: "",
      preprocessMode: "web",
      ocrResults: [],
      ocrReviewRefs: [],
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
      preprocessScanTailor: { ...SCANTAILOR_DEFAULT_OPTIONS },
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
        useExceptionDictionary: true,


      },
    };
  }

  componentDidMount() {
    // Start polling backend service health so steps can disable actions when a
    // required service is offline.
    ServiceStatus.configure(this.sampleStore.api);
    ServiceStatus.start(20000);
  }

  componentWillUnmount() {
    ServiceStatus.stop();
  }

  getStore() {
    return this.sampleStore;
  }

  updateStore(update) {
    this.sampleStore = {
      ...this.sampleStore,
      ...update,
    };
  }

  resetStore() {
    const api = getApiBaseUrl();
    this.sampleStore = {
      api,
      period: "secolulXX", //default is 20th century
      ocrModel: "",
      typography: "",
      alphabet: "cyrillic", //default is cyrillic
      saveToCloud: true,
      savedToCloud: false,
      // uploadFolder: "C:\\Users\\bumbu\\OneDrive\\Desktop\\Projects\\PlatformaDigitizare\\backend\\media",
      uploadFolder: apiUrl("media/", api),
      sourceFiles: [{ "name": "5.jpg", "size": 1535454, "type": "image/jpeg", "lastModifiedDate": "2021-05-27T15:49:52.594Z", "uploadedDate": "2022-05-17T19:15:44.681Z", "percent": 100, "id": "1652814944681-0", "status": "removed", "previewUrl": "blob:http://localhost:8080/3a701ff3-27a9-47ff-9ca3-fc2ce6554e10", "width": 1305, "height": 1333 }],
      s3SourceFiles: [],
      preprocessedFiles: [],
      s3PreprocessedFiles: [],
      preprocessWith: "",
      preprocessMode: "web",
      ocrResults: [],
      ocrReviewRefs: [],
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
      preprocessScanTailor: { ...SCANTAILOR_DEFAULT_OPTIONS },
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

      ocrOptions: {
        useTesseract: false,
      },

      transOptions: {
        actualizeWordForm: true,
        replaceApostrophe: true,
        removeHyphen: true,
        removeDiacritics: false,
        useExceptionDictionary: true,


      },

    };
  }


  render() {
    console.log(this.sampleStore);
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
            resetStore={() => this.resetStore()}
            updateStore={(u) => {
              this.updateStore(u);
            }}
          />
        ),
      },
    ];

    return (
      <div className="example">
        {/* check button saveToCloud */}

        <div className="d-flex justify-content-end p-2">
          <ServiceStatusBadge />
        </div>

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
