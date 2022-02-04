"use strict";

import React from "react";
// You need to import the CSS only once
import "react-awesome-lightbox/build/style.css";
import Form from 'react-bootstrap/Form';
import Accordion from 'react-bootstrap/Accordion';
import Button from 'react-bootstrap/Button';
import RangeSlider from 'react-bootstrap-range-slider';
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';

const Step2 = (props) => {
  console.log(props.getStore());

  const [resolutionOpenCV, setResolutionOpenCV] = React.useState(props.getStore().preprocessOpenCV.resolution);
  const [selectedOption, setSelectedOption] = React.useState(props.getStore().preprocessWith);
  const [show, setShow] = React.useState(false);


  const handleOptionChange = (e) => {
    // this.setState({
    //   selectedOption: e.target.value,
    // });
    setSelectedOption(e.target.value);
    props.updateStore({ preprocessWith: e.target.value });
    setShow(true);
  };


  const handleResolutionChange = (e) => {
    setResolutionOpenCV(e.target.value)
    props.updateStore({ preprocessOpenCV: { ...props.getStore().preprocessOpenCV, resolution: e.target.value } });
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
                    name="group2"
                    id="checkboxFR1"
                    type="checkbox"
                    checked={props.getStore().preprocessFR.correctResolution}
                  />
                  <Form.Check
                    label="Convertește imaginea în alb-negru"
                    name="group2"
                    id="checkboxFR2"
                    type="checkbox"
                    checked={props.getStore().preprocessFR.convertToBlackAndWhite}
                  />
                  <Form.Check
                    label="Reduce zgomotul ISO din text"
                    name="group2"
                    id="checkboxFR3"
                    type="checkbox"
                    checked={props.getStore().preprocessFR.reduceNoise}
                  />
                  <Form.Check
                    label="Îndreaptă rândurile de text"
                    name="group2"
                    id="checkboxFR4"
                    type="checkbox"
                    checked={props.getStore().preprocessFR.straightenTextLines}
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
                    name="group3"
                    id="checkboxCV1"
                    type="checkbox"
                    checked={props.getStore().preprocessOpenCV.setResolution}
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
                    name="group4"
                    id="checkboxCV2"
                    type="checkbox"
                    checked={props.getStore().preprocessOpenCV.removeNoise}
                  />
                </Form.Group>
              </>}
            </div>

            <div className="mt-5 mb-3 col-md-12 d-flex justify-content-center">
              {selectedOption ? <Button variant="primary" onClick={() => props.jumpToStep(2)}>Start preprocesare</Button> : <Button disabled variant="primary">Start preprocesare</Button>}
            </div>
          </div>
        </Form>
      </div>

      {/* source image and preprocessed images */}
      <div className="row">
        <div className="col-md-12 d-flex justify-content-around">
          <div className="col-sm">
            {props.getStore().sourceFiles.length != 0 && <>
              <Accordion defaultActiveKey={['0']} alwaysOpen>
                <Accordion.Item eventKey="0">
                  <Accordion.Header>Source</Accordion.Header>
                  <Accordion.Body>
                    {
                      props.getStore().sourceFiles.map((src, index) => (
                        <img
                          src={src}
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
            {props.getStore().sourceFiles.length != 0 && <>
              <Accordion defaultActiveKey={['0']} alwaysOpen>
                <Accordion.Item eventKey="0">
                  <Accordion.Header>Target</Accordion.Header>
                  <Accordion.Body>
                    {
                      props.getStore().sourceFiles.map((src, index) => (
                        <img
                          src={src}
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
