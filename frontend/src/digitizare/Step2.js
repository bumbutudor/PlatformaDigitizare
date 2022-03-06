"use strict";

import React from "react";
// You need to import the CSS only once
import "react-awesome-lightbox/build/style.css";
import Form from "react-bootstrap/Form";
import Accordion from "react-bootstrap/Accordion";
import Button from "react-bootstrap/Button";
import ListGroup from "react-bootstrap/ListGroup";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import RangeSlider from "react-bootstrap-range-slider";
import "react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css";
import { mdiSourceCommitStartNextLocal } from "@mdi/js";
import ImgsViewer from "react-images-viewer";
import { Fancybox } from "@fancyapps/ui/src/Fancybox/Fancybox.js";
import "@fancyapps/ui/dist/fancybox.css";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import ScanTailor from "../components/ScanTailor";
import FineReaderPre from "../components/FineReaderPre";

// Preprocess the images
const Step2 = (props) => {

  const step2Info =
    (
      <Popover id="popover-basic">
        <Popover.Header as="h4">Informații despre pasul 2</Popover.Header>
        <Popover.Body>
          La acest pas, utilizatorul poate sa aleaga motorul de preprocesare dorit in functie de ce
          ajustari necesita documentul sau. Motoarele de preprocesare a imaginii sunt:
          Modulul de preprocesare a imaginii din FineReader 15, Procesorul de imagini OpenCV, GIMP sau ScanTailor.
          Poate sa aleaga douar unul din aceste 4 motoare de preprocesare a imaginii la un singur ciclu de digitizare.
          Fiecare din aceste moatoare de preprocesare sunt configurate cu setările recomandate cu posibilitatea
          de a modifica la necesitate. Motorul FineReader are urmatoarele optiuni de preprocesare:
          divizarea imaginii in 2 sau mai multe pagini - se foloseste atunci cand avem o imagine
          unde 2 pagini ale unei carti sunt lipite; corectarea automată a rezoluției imaginii - se folosește
          când imaginea a fost scanată cu o rezoluție mai mică de 75dpi și caracterele text se vad neclar
          la zoom maxim; indreptarea orientarii paginii - se foloseste atunci cand imaginea este inclinata cu
          un unghi semnificativ ( mai mare decat 30grade) spre stanga sau dreapta; convertirea imaginii color in alb negru - este o tehnica folosita des la preprocesare a imaginii ce contribuie la o acuratete sporita la recunoastere; reducerea zgomotului ISO din text - se foloseste atunci cand in imagini se observa pete mici sub forma de fulgi in imagine sau cand rezolutia la scanare sau fotografiere este sub 50dpi; indreptarea randurilor de text [TODO].
          Motorul OpenCV propune o multime de setari dintre care se recomanda utilizatorului:
          setarea rezolutiei manual si filtre de curatarea a imaginii de pete si zone neclare.
        </Popover.Body>
      </Popover>
    );


  // console.log(props.getStore());

  const sourceFiles = props.getStore().sourceFiles;

  const [preprocessedFiles, setpreprocessedFiles] = React.useState(
    props.getStore().preprocessedFiles
  );

  const [preprocessOpenCV, setPreprocessOpenCV] = React.useState(
    props.getStore().preprocessOpenCV
  );
  const [resolutionOpenCV, setResolutionOpenCV] = React.useState(
    props.getStore().preprocessOpenCV.resolution
  );
  const [selectedOption, setSelectedOption] = React.useState(
    props.getStore().preprocessWith
  );
  const [show, setShow] = React.useState(true);

  const handleOptionChange = (e) => {
    // this.setState({
    //   selectedOption: e.target.value,
    // });
    setSelectedOption(e.target.value);
    props.updateStore({ preprocessWith: e.target.value });
    setShow(true);
  };


  // Preprocesare cu OpenCV
  const handlePreprocessOpenCVChange = (e) => {
    setPreprocessOpenCV({
      ...preprocessOpenCV,
      [e.target.name]: e.target.checked,
    });
    props.updateStore({
      preprocessOpenCV: {
        ...preprocessOpenCV,
        [e.target.name]: e.target.checked,
      },
    });
  };

  const handleResolutionChange = (e) => {
    setResolutionOpenCV(e.target.value);
    props.updateStore({
      preprocessOpenCV: {
        ...props.getStore().preprocessOpenCV,
        resolution: e.target.value,
      },
    });
  };

  // Fisierele sursa
  const handleFilePath = (filePath) => {
    if (filePath.length > 0) return "http://127.0.0.1:8000/media/" + filePath;
    //https://httpbin.org/post
    //http://127.0.0.1:8000/media/
    return "https://cdn.presslabs.com/wp-content/uploads/2018/10/upload-error.png";
  };

  // Post request
  const handlePreprocessRequest = async () => {
    setShow(false);

    const preprocessAPI = "http://127.0.0.1:8000/preprocess/";
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(props.getStore()),
    };
    const response = await fetch(preprocessAPI, requestOptions);
    const data = await response.json();
    console.log(data);
    if (data.preprocessedFiles) {
      setpreprocessedFiles(data.preprocessedFiles);
      props.updateStore({ preprocessedFiles: data.preprocessedFiles });
    }

  };

  return (
    <div className="step step2">
      <div className="row">
        <Form id="Form" className="form-horizontal">
          <Form.Group>
            <Form.Label className="col-md-12 control-label d-flex">
              <h1>Pasul 2: Preprocesarea imaginilor încărcate</h1>
              <OverlayTrigger trigger="click" rootClose placement="right" overlay={step2Info}>
                <Button type="button" className="btn btn-info text-white mx-4">Info</Button>
              </OverlayTrigger>
            </Form.Label>
          </Form.Group>

          <div className="row content">
            <Form.Group className="mb-3 col-sm">
              <Form.Label>2.1 Selectează motorul de preprocesare:</Form.Label>
              <Form.Check
                // disabled
                label="ScanTailor"
                name="group1"
                type="radio"
                id="radio3"
                value="ScanTailor"
                checked={selectedOption === "ScanTailor"}
                onChange={handleOptionChange}
              />
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
              {selectedOption === "FR" && (
                <>
                  <FineReaderPre getStore={() => props.getStore()}
                    updateStore={(u) => {
                      props.updateStore(u);
                    }} />
                </>
              )}

              {/* Preprocesare cu OpenCV */}
              {selectedOption === "OpenCV" && (
                <>
                  <Form.Group>
                    <Form.Label>
                      2.2 Opțiuni de preprocesare cu OpenCV
                    </Form.Label>
                  </Form.Group>
                  <Form.Group
                    className="mb-5 display-flex"
                    id="openCVResolution"
                  >
                    <Form.Check
                      label="Setează rezoluția imaginii"
                      name="setResolution"
                      id="checkboxCV1"
                      type="checkbox"
                      checked={preprocessOpenCV.setResolution}
                      onChange={handlePreprocessOpenCVChange}
                    />
                    {props.getStore().preprocessOpenCV.setResolution && (
                      <div className="row mt-2">
                        <div className="col-9">
                          <RangeSlider
                            value={resolutionOpenCV}
                            tooltipLabel={(resolutionOpenCV) =>
                              `${resolutionOpenCV} dpi`
                            }
                            onChange={handleResolutionChange}
                            // tooltip="on"
                            min={75}
                            max={1200}
                            step={25}
                          />
                        </div>
                        <div className="col-3 text-warning">
                          <Form.Control value={resolutionOpenCV} onChange={handleResolutionChange} />
                        </div>
                      </div>
                    )}
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
                </>
              )}

              {/* Preprocesare cu ScanTailor */}
              {selectedOption === "ScanTailor" && (
                <>
                  <ScanTailor getStore={() => props.getStore()}
                    updateStore={(u) => {
                      props.updateStore(u);
                    }} />
                </>
              )}
            </div>

            <div className="mt-5 mb-3 col-md-12 d-flex justify-content-center">

              {selectedOption && show ? (<>
                <Button variant="primary" onClick={handlePreprocessRequest}>
                  Start preprocesare
                </Button> </>
              ) : (
                <Button disabled variant="primary">
                  Start preprocesare
                </Button>
              )}
              {!show && (
                <>
                  {" "}
                  <Button
                    variant="primary mx-4"
                    onClick={() => props.jumpToStep(2)}
                  >
                    Mergi la pasul următor - OCR
                  </Button>{" "}
                </>
              )}
            </div>
          </div>
        </Form>
      </div >

      {/* source image and preprocessed images */}
      < div className="row" >
        <div className="col-md-12 d-flex justify-content-around">
          <div className="col-sm">
            {sourceFiles.length != 0 && (
              <>
                <Accordion defaultActiveKey={["0"]} alwaysOpen>
                  <Accordion.Item eventKey="0">
                    <Accordion.Header>
                      Sursa - imagine originală{" "}
                    </Accordion.Header>
                    <Accordion.Body>
                      {sourceFiles.map((src, index) => (
                        <a
                          className=""
                          data-fancybox="gallery_1"
                          data-src={handleFilePath(src.name)}
                          data-caption="imagine originală"
                          key={index}
                        >
                          <img
                            className="Accordion_image"
                            src={handleFilePath(src.name)}
                          />
                        </a>
                      ))}
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>
              </>
            )}
          </div>

          <div className="col-sm">
            {preprocessedFiles.length != 0 && (
              <>
                <Accordion defaultActiveKey={["0"]} alwaysOpen>
                  <Accordion.Item eventKey="0">
                    <Accordion.Header>
                      Ținta - imagine preprocesată
                    </Accordion.Header>
                    <Accordion.Body>
                      {preprocessedFiles.map((src, index) => (
                        <a
                          className=""
                          data-fancybox="gallery_2"
                          data-src={handleFilePath(src)}
                          data-caption="imagine preprocesată"
                          key={index}
                        >
                          <img
                            className="Accordion_image"
                            src={handleFilePath(src)}
                          />
                        </a>
                      ))}
                    </Accordion.Body>
                  </Accordion.Item>
                </Accordion>
              </>
            )}
          </div>
        </div>
      </div >
    </div >
  );
};
export default Step2;
