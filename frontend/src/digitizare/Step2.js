"use strict";

import React from "react";
// You need to import the CSS only once
import "react-awesome-lightbox/build/style.css";
import Form from 'react-bootstrap/Form';
import Accordion from 'react-bootstrap/Accordion';
import Button from 'react-bootstrap/Button';
import RangeSlider from 'react-bootstrap-range-slider';
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';
import { mdiSourceCommitStartNextLocal } from "@mdi/js";

const Step2 = (props) => {
  console.log(props.getStore());

  const sourceFiles = props.getStore().sourceFiles;
  const [preprocessedFiles, setpreprocessedFiles] = React.useState(props.getStore().preprocessedFiles);
  const [preprocessFR, setPreprocessFR] = React.useState(props.getStore().preprocessFR);
  const [preprocessOpenCV, setPreprocessOpenCV] = React.useState(props.getStore().preprocessOpenCV);
  const [resolutionOpenCV, setResolutionOpenCV] = React.useState(props.getStore().preprocessOpenCV.resolution);
  const [selectedOption, setSelectedOption] = React.useState(props.getStore().preprocessWith);
  const [show, setShow] = React.useState(true);


  const handleOptionChange = (e) => {
    // this.setState({
    //   selectedOption: e.target.value,
    // });
    setSelectedOption(e.target.value);
    props.updateStore({ preprocessWith: e.target.value });
    setShow(true);
  };

  // Preprocesare cu FineReader
  const handlePreprocessFRChange = (e) => {
    setPreprocessFR({ ...preprocessFR, [e.target.name]: e.target.checked });
    props.updateStore({ preprocessFR: { ...preprocessFR, [e.target.name]: e.target.checked } });
  }

  // Preprocesare cu OpenCV
  const handlePreprocessOpenCVChange = (e) => {
    setPreprocessOpenCV({ ...preprocessOpenCV, [e.target.name]: e.target.checked });
    props.updateStore({ preprocessOpenCV: { ...preprocessOpenCV, [e.target.name]: e.target.checked } });
  }

  const handleResolutionChange = (e) => {
    setResolutionOpenCV(e.target.value)
    props.updateStore({ preprocessOpenCV: { ...props.getStore().preprocessOpenCV, resolution: e.target.value } });
  }

  // Fisierele sursa
  const handleFilePath = (filePath) => {
    if (filePath.length > 0) return 'http://127.0.0.1:8000/media/' + filePath;
    return "https://cdn.presslabs.com/wp-content/uploads/2018/10/upload-error.png";
  }

  // Post request
  const handlePreprocessRequest = async () => {
    const preprocessAPI = "http://127.0.0.1:8000/preprocess/";

    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(props.getStore())
    };
    const response = await fetch(preprocessAPI, requestOptions);
    const data = await response.json();

    setpreprocessedFiles(data.preprocessedFiles);
    setShow(false);
    props.updateStore({ preprocessedFiles: data.preprocessedFiles });
  }

  return (
    <div className="step step2">
      <div className="row">
        <Form id="Form" className="form-horizontal">
          <Form.Group>
            <Form.Label className="col-md-12 control-label">
              <h1>Pasul 2: Preprocesarea imaginilor încărcate</h1>
            </Form.Label>
          </Form.Group>

          <div className="row content">
            <Form.Group className="mb-3 col-sm">
              <Form.Label>2.1 Selectează motorul de preprocesare:</Form.Label>
              <Form.Check
                label="FineReader"
                name="group1"
                type="radio"
                id="radio1"
                value="FR"
                checked={selectedOption === "FR"}
                onChange={handleOptionChange}
              />
              <Form.Check
                label="OpenCV"
                name="group1"
                type="radio"
                id="radio2"
                value="OpenCV"
                checked={selectedOption === "OpenCV"}
                onChange={handleOptionChange}
              />
              <Form.Check
                disabled
                label="ScanTaylor (disabled)"
                name="group1"
                type="radio"
                id="radio3"
                value="ScanTaylor"
                checked={selectedOption === "ScanTaylor"}
                onChange={handleOptionChange}
              />
              <Form.Check
                disabled
                label="Gimp (disabled)"
                name="group1"
                type="radio"
                id="radio4"
                value="Gimp"
                checked={selectedOption === "Gimp"}
                onChange={handleOptionChange}
              />
            </Form.Group>
            <div className="col-sm mb-3">
              {selectedOption === "FR" && <>

                <Form.Group>
                  <Form.Label>2.2 Opțiuni de preprocesare cu FineReader recomandate:</Form.Label>
                </Form.Group>
                <Form.Group>
                  <Form.Check
                    label="Corectează rezoluția imaginii"
                    name="correctResolution"
                    id="checkboxFR1"
                    type="checkbox"
                    checked={preprocessFR.correctResolution}
                    onChange={handlePreprocessFRChange}
                  />
                  <Form.Check
                    label="Convertește imaginea în alb-negru"
                    name="convertToBlackAndWhite"
                    id="checkboxFR2"
                    type="checkbox"
                    checked={preprocessFR.convertToBlackAndWhite}
                    onChange={handlePreprocessFRChange}
                  />
                  <Form.Check
                    label="Reduce zgomotul ISO din text"
                    name="reduceNoise"
                    id="checkboxFR3"
                    type="checkbox"
                    checked={preprocessFR.reduceNoise}
                    onChange={handlePreprocessFRChange}
                  />
                  <Form.Check
                    label="Îndreaptă rândurile de text"
                    name="straightenTextLines"
                    id="checkboxFR4"
                    type="checkbox"
                    checked={preprocessFR.straightenTextLines}
                    onChange={handlePreprocessFRChange}
                  />
                </Form.Group>
              </>}

              {selectedOption === "OpenCV" && <>
                <Form.Group>
                  <Form.Label>2.2 Opțiuni de preprocesare cu OpenCV</Form.Label>
                </Form.Group>
                <Form.Group className="mb-5 display-flex" id="openCVResolution">
                  <Form.Check
                    label="Setează rezoluția imaginii"
                    name="setResolution"
                    id="checkboxCV1"
                    type="checkbox"
                    checked={preprocessOpenCV.setResolution}
                    onChange={handlePreprocessOpenCVChange}
                  />
                  {props.getStore().preprocessOpenCV.setResolution && <>
                    <RangeSlider

                      value={resolutionOpenCV}
                      tooltipLabel={resolutionOpenCV => `${resolutionOpenCV}dpi`}
                      onChange={handleResolutionChange}
                      tooltip='on'
                      min={75}
                      max={1200}
                      step={25}
                    />
                  </>}
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Check
                    label="Șterge zgomotul și neclaritatea din imagine"
                    name="removeNoise"
                    id="checkboxCV2"
                    type="checkbox"
                    checked={preprocessOpenCV.removeNoise}
                    onChange={handlePreprocessOpenCVChange}
                  />
                </Form.Group>
              </>}
            </div>

            <div className="mt-5 mb-3 col-md-12 d-flex justify-content-center">
              {selectedOption && show ? <Button variant="primary" onClick={handlePreprocessRequest}>Start preprocesare</Button> : <Button disabled variant="primary">Start preprocesare</Button>}
              {!show && <> <Button variant="primary mx-4" onClick={() => props.jumpToStep(2)}>Mergi la pasul următor</Button> </>}
            </div>
          </div>
        </Form>
      </div>

      {/* source image and preprocessed images */}
      <div className="row">
        <div className="col-md-12 d-flex justify-content-around">
          <div className="col-sm">
            {sourceFiles.length != 0 && <>
              <Accordion defaultActiveKey={['0']} alwaysOpen>
                <Accordion.Item eventKey="0">
                  <Accordion.Header>Source</Accordion.Header>
                  <Accordion.Body>
                    {
                      sourceFiles.map((src, index) => (
                        <img
                          src={handleFilePath(src.name)}
                          onClick={() => openImageViewer(index)}
                          width="300"
                          key={index}
                          style={{ margin: "2px" }}
                          alt=""
                        />
                      ))
                    }
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </>}
          </div>

          <div className="col-sm">
            {preprocessedFiles.length != 0 && <>
              <Accordion defaultActiveKey={['0']} alwaysOpen>
                <Accordion.Item eventKey="0">
                  <Accordion.Header>Target</Accordion.Header>
                  <Accordion.Body>
                    {
                      preprocessedFiles.map((src, index) => (
                        <img
                          src={handleFilePath(src)}
                          onClick={() => openImageViewer(index)}
                          width="300"
                          key={index}
                          style={{ margin: "2px" }}
                          alt=""
                        />
                      ))
                    }
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </>}
          </div>
        </div>
      </div >
    </div >
  );
}
export default Step2;
