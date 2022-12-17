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
import OpenCV from "../components/OpenCV";
import Spinner from "react-bootstrap/Spinner";
import Alert from 'react-bootstrap/Alert'
import FetchWrapper from "../components/FetchWrapper";
import Draggable from 'react-draggable'; // The default

// Step 2 - preprocess the images
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
  const s3SourceFiles = props.getStore().s3SourceFiles;

  const [preprocessedFiles, setpreprocessedFiles] = React.useState(
    props.getStore().preprocessedFiles
  );

  const [s3PreprocessedFiles, setS3PreprocessedFiles] = React.useState(
    props.getStore().s3PreprocessedFiles
  );

  const [selectedOption, setSelectedOption] = React.useState(
    props.getStore().preprocessWith
  );
  const [show, setShow] = React.useState(true);
  const [showLoader, setShowLoader] = React.useState(false);
  const [showNextStep, setShowNextStep] = React.useState(false);
  const [showError, setShowError] = React.useState(false);

  const handleOptionChange = (e) => {
    // this.setState({
    //   selectedOption: e.target.value,
    // });
    setSelectedOption(e.target.value);
    props.updateStore({ preprocessWith: e.target.value });
    setShow(true);
  };

  // Fisierele sursa
  const handleFilePath = (filePath) => {
    if (filePath.length > 0) return "https://a926-81-180-76-251.eu.ngrok.io/media/" + filePath; // localhost dev server url http://127.0.0.1:8000/media/
    //https://httpbin.org/post
    //http://127.0.0.1:8000/media/
    return "https://cdn.presslabs.com/wp-content/uploads/2018/10/upload-error.png";
  };

  // Post request
  const API = new FetchWrapper("https://a926-81-180-76-251.eu.ngrok.io/"); // localhost dev server url http://127.0.0.1:8000/

  const handlePreprocessRequest = async () => {
    setShow(false);
    setShowError(false);
    setShowNextStep(false);
    setShowLoader(true);



    const preprocessEndpoint = "preprocess/";
    const requestBody = props.getStore();

    API.post(preprocessEndpoint, requestBody)
      .then(data => {
        // console.log(data);
        if (data.preprocessedFiles.length > 0) {
          setShowNextStep(true);
          setpreprocessedFiles(data.preprocessedFiles);
          setS3PreprocessedFiles(data.s3PreprocessedFiles);
          props.updateStore({ preprocessedFiles: data.preprocessedFiles, s3PreprocessedFiles: data.s3PreprocessedFiles });
        } else {
          setShowError(true);
        }

      })
      .catch(err => {
        console.error(err)
        setShowError(true);
      })
      .finally(() => {
        setShow(false);
        setShowLoader(false);
      });

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
            <Form.Group className="mb-3 col-sm-3 border">
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
                  <OpenCV getStore={() => props.getStore()}
                    updateStore={(u) => {
                      props.updateStore(u);
                    }} />
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

            <div className="mt-2 mb-3 col-md-12 d-flex justify-content-center">

              {selectedOption && show ? (<>
                <Button variant="primary" onClick={handlePreprocessRequest}>
                  Start preprocesare
                </Button> </>
              ) : (
                <Button disabled variant="primary">
                  {showLoader ? (<><Spinner animation="border" /> Se preprocesează...</>) : (<>Start preprocesare</>)}
                </Button>
              )}
              {showNextStep && (<>
                {" "}
                <Button
                  variant="primary mx-4"
                  onClick={() => props.jumpToStep(2)}
                >
                  Mergi la pasul următor - recunoaşterea textului din imaginea preprocesată
                </Button>{" "}
              </>
              )}
            </div>
            {showError && (
              <Alert variant="danger">
                <Alert.Heading>Eroare la preprocesare! Incearcă din nou...</Alert.Heading>
              </Alert>
            )}
          </div>
        </Form>
      </div >

      {/* source image and preprocessed images */}
      < div className="row" >
        <div className="container-for-results col-md-12 d-flex p-2 border gap-2 bg-light rounded">
          <Draggable>
            <div className="col-sm">
              {sourceFiles.length != 0 && (
                <>
                  <Accordion defaultActiveKey={["0"]} alwaysOpen>
                    <Accordion.Item eventKey="0">
                      <Accordion.Header>
                        Sursa - imagine originală{" "}
                      </Accordion.Header>
                      <Accordion.Body>
                        {s3SourceFiles.map((file, index) => (
                          <a
                            className=""
                            data-fancybox="gallery_1"
                            data-src={file.url}
                            data-caption={`${file.name} (imagine originală)`}
                            key={index}
                          >
                            <img
                              className="Accordion_image"
                              src={file.url}
                            />
                          </a>
                        ))}
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>
                </>
              )}
            </div>
          </Draggable>

          <Draggable>
            <div className="col-sm">
              {s3PreprocessedFiles.length != 0 && (
                <>
                  <Accordion defaultActiveKey={["0"]} alwaysOpen>
                    <Accordion.Item eventKey="0">
                      <Accordion.Header>
                        Ținta - imagine preprocesată
                      </Accordion.Header>
                      <Accordion.Body>
                        {s3PreprocessedFiles.map((s3_url, index) => (
                          <a
                            className=""
                            data-fancybox="gallery_2"
                            data-src={s3_url}
                            data-caption="imagine procesată"
                            key={index}
                          >
                            <img
                              className="Accordion_image"
                              src={s3_url}
                            />
                          </a>
                        ))}
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>
                </>
              )}
            </div>
          </Draggable>

        </div>
      </div >
    </div >
  );
};
export default Step2;
