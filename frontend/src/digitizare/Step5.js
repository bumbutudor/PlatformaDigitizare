'use strict';

import React, { Component } from 'react';
import Form from 'react-bootstrap/Form';
import Accordion from 'react-bootstrap/Accordion';
import Button from 'react-bootstrap/Button';
import OverlayTrigger from 'react-bootstrap/esm/OverlayTrigger';
import Overlay from 'react-bootstrap/esm/Overlay';
import FetchWrapper from '../components/FetchWrapper';
import Spinner from "react-bootstrap/Spinner";
import Alert from 'react-bootstrap/Alert';
import Popover from "react-bootstrap/Popover";
import Draggable from 'react-draggable'; // The default
import DictionaryModal from '../components/DictionaryModal';


// Transliteraion
export default class Step5 extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "a@a.com",
      period: props.getStore().period,
      typography: props.getStore().typography,
      preprocessedFiles: props.getStore().preprocessedFiles,
      alphabet: props.getStore().alphabet,
      sourceFiles: props.getStore().sourceFiles,
      ocrResults: props.getStore().ocrResults,
      transResults: props.getStore().transResults,
      transOptions: props.getStore().transOptions,
      dictionaryInfo:
        (
          <Popover id="popover-basic">
            <Popover.Header as="h4">Dicționar de excepții</Popover.Header>
            <Popover.Body>
              <p>Dictionarul include cuvinte care nu pot fi transliterate utilând reguli de transliterare. </p>
              <p>De exemplu, cuvântul <em>амязэ</em> conform regulilor de transliterare trece in <em>amează</em>, iar varianta corectă <b><em>amiază</em></b> se află în dicționar.</p>
              <Button variant="primary" onClick={() => this.setState({ showModal: true })}>
                Gestionează dicționarul
              </Button>
            </Popover.Body>
          </Popover>
        ),
      aboutOpenAI:
        (
          <Popover id="popover-basic">
            <Popover.Header as="h4">OpenAI și GPT-3</Popover.Header>
            <Popover.Body>
              <p>OpenAI este o companie de cercetare în inteligență artificială (IA) care se concentrează pe dezvoltarea tehnologiilor de învățare automată (machine learning) avansate și pe aplicarea lor în domenii precum jocuri, limbaj și robotică. OpenAI a fost fondată în 2015 de Elon Musk, Sam Altman, Greg Brockman și Ilya Sutskever cu scopul de a promova și proteja IA prin dezvoltarea unor tehnologii responsabile și sigure.</p>
              <p>GPT-3 (Generative Pre-training Transformer 3) este un model de învățare automată dezvoltat de OpenAI care poate fi utilizat pentru a genera text, răspunde la întrebări și îndeplini diverse sarcini de procesare a limbajului natural. GPT-3 este unul dintre cele mai mari modele de învățare automată disponibile public, cu 175 miliarde de parametri, și este considerat un pas important în direcția dezvoltării modelelor de învățare automată capabile să îndeplinească diverse sarcini de procesare a limbajului natural.</p>
              <p>Pentru mai multe informații despre GPT-3, puteți vizita site-ul oficial al OpenAI la adresa <a href="https://openai.com/blog/gpt-3-apps/">https://openai.com/blog/gpt-3-apps/</a>. Acolo veți găsi detalii despre funcționarea și utilizarea GPT-3, precum și exemple de aplicații care au fost construite utilizând acest model. De asemenea, puteți găsi mai multe informații despre GPT-3 pe Wikipedia la adresa <a href="https://en.wikipedia.org/wiki/GPT-3">https://en.wikipedia.org/wiki/GPT-3</a>.</p>

            </Popover.Body>
          </Popover>
        ),
      show: true,
      showLoader: false,
      showNextStep: false,
      showErrors: false,
      showModal: false,
    };

    this.alphabetOptions = props.getStore().alphabetOptions;
    this.periodOptions = props.getStore().periodOptions;

    this.API = new FetchWrapper(props.getStore().api); // localhost dev server url http://127.0.0.1:8000/

  }

  componentDidMount() { }

  componentWillUnmount() { }



  handleFilePath(filePath) {
    if (filePath.length > 0) return 'https://a926-81-180-76-251.eu.ngrok.io/media/' + filePath;
    return "https://cdn.presslabs.com/wp-content/uploads/2018/10/upload-error.png";
  }

  handleTransOptionsChange(e) {
    let newState = this.state.transOptions;
    newState[e.target.name] = e.target.checked;
    this.setState(newState);
    // this.props.updateStore({ transOptions: { ...this.state.transOptions, [e.target.name]: e.target.checked } });
  }

  async handleTransRequest() {
    this.setState({ show: false });
    this.setState({ showError: false });
    this.setState({ showLoader: true });

    const transEndpoint = 'transliterate/';
    const postData = this.state;
    this.API.post(transEndpoint, postData)
      .then((data) => {
        if (data.transResults.length > 0) {
          console.log(data.transResults);
          this.setState({ transResults: data.transResults });
          this.props.updateStore({ transResults: data.transResults });
          this.setState({ showNextStep: true });
        } else {
          this.setState({ showError: true });
        }
      })
      .catch((error) => {
        console.log(error);
        this.setState({ showError: true });
      })
      .finally(() => {
        this.setState({ showLoader: false });
      });

  }
  render() {

    console.log(this.state.transOptions.exceptions.dict);

    return (
      <div className="step step3">
        <div className="row">
          <Form className="form-horizontal">
            <Form.Group>
              <label className="col-md-12 control-label">
                <h1>Pasul 5: Transliterarea textului recunoscut </h1>
              </label>
            </Form.Group>

            <div className="row content">
              <div className="mb-3 col-sm-3 border">
                <Form.Group >
                  <Form.Label>5.1 Perioada documentului este:
                    <span className='text-primary mx-2'>{this.periodOptions[this.state.period]}</span>
                  </Form.Label>

                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>5.2 Alfabetul documentului este:
                    <span className='text-primary mx-2'>{this.alphabetOptions[this.state.alphabet]}</span>
                  </Form.Label>

                </Form.Group>
              </div>
              <Form.Group className="col-sm">
                <Form.Label>5.3 Setări de transliterare:</Form.Label>
                <Form.Check
                  label="Actualizează ortografia (gînd => gând)"
                  name="actualizeWordForm"
                  id="checkboxTrans1"
                  type="checkbox"
                  checked={this.state.transOptions.actualizeWordForm}
                  onChange={this.handleTransOptionsChange.bind(this)}
                />



                <div className='d-flex'>
                  <Form.Check
                    disabled
                    label="Folosește dicționarul de excepții"
                    name="removeHyphen"
                    id="checkboxTrans3"
                    type="checkbox"
                  // checked={this.state.transOptions.removeHyphen}
                  // onChange={this.handleTransOptionsChange.bind(this)}
                  />
                  <OverlayTrigger trigger="click" rootClose placement="right" overlay={this.state.dictionaryInfo}>
                    <Button type="button" className="btn btn-info text-white mx-4">?</Button>
                  </OverlayTrigger>

                  <DictionaryModal show={this.state.showModal} onHide={() => this.setState({ showModal: false })} />

                </div>
                <div className='d-flex'>

                  <Form.Check
                    label="Corectează textul cu agentul inteligent de la OpenAI"
                    name="correctTextWithGPT3"
                    id="checkboxTrans4"
                    type="checkbox"
                    checked={this.state.transOptions.correctTextWithGPT3}
                    onChange={this.handleTransOptionsChange.bind(this)}
                  />

                  <OverlayTrigger trigger="click" rootClose placement="left" overlay={this.state.aboutOpenAI}>
                    <Button type="button" className="btn btn-info text-white mx-4">?</Button>
                  </OverlayTrigger>

                </div>

              </Form.Group>
              <div className="mt-2 mb-3 col-md-12 d-flex justify-content-center">
                {
                  this.state.show ?
                    <Button
                      variant="primary"
                      onClick={this.handleTransRequest.bind(this)}>
                      Start Transliterare
                    </Button>
                    :
                    <Button
                      variant="primary"
                      disabled>{
                        this.state.showLoader ? <>
                          <Spinner animation="border" role="status" />
                          <span className="sr-only">Se transliterează...</span>
                        </>
                          : "Start Transliterare"
                      }
                    </Button>
                }
                {
                  this.state.showNextStep && !this.state.showLoader && (
                    <>
                      <Button variant="primary mx-4" onClick={() => this.props.jumpToStep(5)}>Verifică și editează rezultatul</Button>
                    </>
                  )
                }
                {/* {this.state.period && this.state.show ? <Button variant="primary" onClick={handleTransRequest}>Start Transliterare</Button> : <Button variant="primary" disabled>Start Transliterare</Button>}
                {!this.state.show && <> <Button variant="primary mx-4" onClick={() => this.props.jumpToStep(5)}>Verifică și editează rezultatul</Button> </>} */}
              </div>
              {this.state.showError && <Alert variant="danger">A apărut o eroare la transliterare. Vă rugăm să încercați din nou.</Alert>}
            </div>
          </Form>
        </div>

        {/* preprocessed image and reognized text */}
        <Draggable>
          <div className="row">
            <div className="col-md-12 d-flex justify-content-around">
              <div className="col-sm">
                {this.state.ocrResults.length != 0 && <>
                  <Accordion defaultActiveKey={['0']} alwaysOpen>
                    <Accordion.Item eventKey="0">
                      <Accordion.Header>Sursa - textul recunoscut și editat</Accordion.Header>
                      <Accordion.Body>
                        {
                          this.state.ocrResults.map((text, index) => (
                            <div className="ocrResult mb-4" key={index}>
                              {/* <span className="ocrResultTitle text-info">{`Rezultatul OCR pentru imaginea ${index + 1}:`}</span> */}
                              <p key={index} alt="">{text}</p>
                            </div>
                          ))
                        }
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>
                </>}
              </div>

              <div className="col-sm">
                {this.state.transResults != 0 && <>
                  <Accordion defaultActiveKey={['0']} alwaysOpen>
                    <Accordion.Item eventKey="0">
                      <Accordion.Header>Ținta - textul transliterat </Accordion.Header>
                      <Accordion.Body>
                        {
                          this.state.transResults.map((text, index) => (
                            <div className="transResult mb-4" key={index}>
                              {/* <span className="transResultTitle text-info">{`Rezultatul OCR pentru imaginea ${index + 1}:`}</span> */}
                              <p key={index} alt="">{text}</p>
                            </div>
                          ))
                        }
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>
                </>}
              </div>
            </div>
          </div>
        </Draggable>

      </div>
    )
  }
}
