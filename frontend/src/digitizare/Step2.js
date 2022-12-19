"use strict";

import React from "react";
// You need to import the CSS only once
import "react-awesome-lightbox/build/style.css";
import Form from "react-bootstrap/Form";
import Accordion from "react-bootstrap/Accordion";
import Button from "react-bootstrap/Button";
import "react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css";
import "@fancyapps/ui/dist/fancybox.css";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import ScanTailor from "../components/ScanTailor";
import FineReaderPreprocessor from "../components/FineReaderPreprocessor";
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
    setSelectedOption(e.target.value);
    props.updateStore({ preprocessWith: e.target.value });
    setShow(true);
  };

  // Post request
  const API = new FetchWrapper(props.getStore().api); // localhost dev server url http://127.0.0.1:8000/

  const handlePreprocessRequest = async () => {
    setShow(false);
    setShowError(false);
    setShowNextStep(false);
    setShowLoader(true);



    const preprocessEndpoint = "preprocess/";
    const requestBody = props.getStore();

    API.post(preprocessEndpoint, requestBody)
      .then(data => {
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

          <div className="row content gap-2 ">
            <Form.Group className="mb-3 col-sm-3 border rounded p-2 bg-light">
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

            {selectedOption === "FR" && (
              <div className="col-sm border rounded p-2 bg-light">
                <FineReaderPreprocessor getStore={() => props.getStore()}
                  updateStore={(u) => {
                    props.updateStore(u);
                  }} />
              </div>
            )}

            {/* Preprocesare cu OpenCV */}
            {selectedOption === "OpenCV" && (
              <div className="col-sm border rounded p-2 bg-light">
                <OpenCV getStore={() => props.getStore()}
                  updateStore={(u) => {
                    props.updateStore(u);
                  }} />
              </div>
            )}

            {/* Preprocesare cu ScanTailor */}
            {selectedOption === "ScanTailor" && (
              <div className="col-sm border rounded p-2 bg-light">
                <ScanTailor getStore={() => props.getStore()}
                  updateStore={(u) => {
                    props.updateStore(u);
                  }} />
              </div>
            )}


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
      <div className="row container-for-results p-2 border gap-2 bg-light rounded">
        {s3SourceFiles.length == 0 && <>
          <h1 className="text-center">Aici vor apărea rezultatele</h1>
          <div className="d-flex justify-content-evenly">
            <h3>In stanga vei vedea imaginile originale.</h3>
            <h3>Iar in dreapta imaginile preprocesate.</h3>
          </div>
        </>}
        {s3SourceFiles.length != 0 && (
          <>
            <div className="col-6">
              <Accordion defaultActiveKey={["0"]} alwaysOpen>
                {s3SourceFiles.map((file, index) => (
                  <Accordion.Item eventKey={index} key={index}>
                    <Accordion.Header>
                      Sursa - imagine originală {index + 1}
                    </Accordion.Header>
                    <Accordion.Body>
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
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            </div>
          </>
        )}
        {s3PreprocessedFiles.length != 0 && (
          <>
            <div className="col-sm">
              <Accordion defaultActiveKey={["0"]} alwaysOpen>
                {s3PreprocessedFiles.map((s3_url, index) => (
                  <Accordion.Item eventKey={index} key={index}>
                    <Accordion.Header>
                      Ținta - imagine preprocesată {index + 1}
                    </Accordion.Header>
                    <Accordion.Body>
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
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
export default Step2;
