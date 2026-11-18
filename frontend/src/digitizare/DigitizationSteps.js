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
import { readDigiSession, saveDigiSession, clearDigiSession, handoffFromLocation, digiRequest } from '../utils/DigiBridge';

import "../css/main.css";

export default class DigitizationSteps extends Component {
  constructor(props) {
    super(props);
    this.state = { importingDigi: true, digiError: '' };
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
      sourceFiles: [],
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

  async componentDidMount() {
    // Start polling backend service health so steps can disable actions when a
    // required service is offline.
    ServiceStatus.configure(this.sampleStore.api);
    ServiceStatus.start(20000);
    try {
      if (this.props.handoffError) throw new Error(this.props.handoffError);
      const saved = readDigiSession();
      const context = this.props.digiContext || handoffFromLocation() || (saved && saved.digiContext);
      if (saved && saved.digiImported !== false && (!context || saved.digiContext.id === context.id)) {
        this.sampleStore = { ...this.sampleStore, ...saved, api: this.sampleStore.api };
      } else if (context) {
        this.sampleStore.digiContext = context;
        this.sampleStore.digiImported = false;
        saveDigiSession(this.sampleStore);
        const data = await digiRequest(this.sampleStore.api, 'digi/jobs/' + context.id + '/import/', context);
        const hasPdf = data.sourceFiles.some(file => file.isPdf);
        this.updateStore({ ...data, digiContext: context, digiImported: true, sourceFiles: data.sourceFiles,
          hasPdfFiles: hasPdf, preprocessWith: hasPdf ? 'None' : '',
          preprocessedFiles: hasPdf ? data.sourceFiles : [],
          s3PreprocessedFiles: hasPdf ? data.s3SourceFiles.map(file => file.url) : [],
        });
        sessionStorage.setItem('step', data.sourceFiles.length ? (hasPdf ? '2' : '1') : '0');
      }
    } catch (error) { this.setState({ digiError: error.message }); }
    this.setState({ importingDigi: false });
  }

  componentWillUnmount() {
    ServiceStatus.stop();
  }

  getStore() {
    return this.sampleStore;
  }

  updateStore(update) {
    if (['ocrResults', 'transResults', 'sourceFiles'].some(key => key in update &&
        JSON.stringify(update[key]) !== JSON.stringify(this.sampleStore[key]))) {
      update = { ...update, digiPublication: null };
    }
    this.sampleStore = {
      ...this.sampleStore,
      ...update,
    };
    saveDigiSession(this.sampleStore);
  }

  resetStore() {
    clearDigiSession();
    sessionStorage.removeItem('step');
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
      sourceFiles: [],
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
    if (this.state.importingDigi) return <p role="status">Se pregătesc documentele…</p>;
    if (this.state.digiError) return <div role="alert" className="alert alert-danger">
      {this.state.digiError} <button type="button" onClick={() => location.reload()}>Reîncearcă</button>{' '}
      <a href="https://digi.emoldova.org/digitizare">Revino în Digi</a>
    </div>;
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
