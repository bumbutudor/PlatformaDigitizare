"use strict";

import React, { Component } from "react";
import PropTypes from "prop-types";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import layouts from "../components/KeyboardLayouts";
import Row from "react-bootstrap/esm/Row";
import Col from "react-bootstrap/esm/Col";
import Accordion from "react-bootstrap/Accordion";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import AddExceptionWidget from "../components/AddExceptionWidget";
import { getDictionary } from "../utils/ApiService";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import StepsInfo from "../components/StepsInfo";
import ReactImageLightbox from "react-image-lightbox";
import "react-image-lightbox/style.css"; // This only needs to be imported once in your app

// PDF Viewer Component with search support
const PdfViewerWithSearch = ({ url, title, searchWord, onClose }) => (
  <Modal show={true} onHide={onClose} size="xl" centered>
    <Modal.Header closeButton>
      <Modal.Title>{title} {searchWord && `- Căutare: "${searchWord}"`}</Modal.Title>
    </Modal.Header>
    <Modal.Body style={{ height: '80vh' }}>
      <iframe 
        src={searchWord ? `${url}#search=${encodeURIComponent(searchWord)}` : url}
        title={title}
        width="100%" 
        height="100%" 
        style={{ border: 'none' }}
      />
    </Modal.Body>
  </Modal>
);

class Step6 extends Component {
  constructor(props) {
    super(props);

    this.state = {
      transResults: props.getStore().transResults,
      sourceFiles: props.getStore().sourceFiles,
      preprocessedFiles: props.getStore().preprocessedFiles,
      layoutName: "default",
      s3PreprocessedFiles: props.getStore().s3PreprocessedFiles,
      s3SourceFiles: props.getStore().s3SourceFiles,
      period: props.getStore().period,

      show: false,
      showNextStep: false,
      inputID: 0,
      caretPositions: {}, // Keep track of caret positions for each textarea

      isLightboxOpen: false,
      lightboxImageSrc: "",
      
      // Context menu state
      showContextMenu: false,
      contextMenuX: 0,
      contextMenuY: 0,
      selectedWord: "",
      activeDocIndex: 0,
      
      // PDF search modal
      showPdfSearchModal: false,
      pdfSearchWord: "",
    };

    this.textareaRefs = {}; // References to textareas
    this.keyboard = null; // Reference to the virtual keyboard
    this.romanian = layouts["latin"];
    this.cyrillicRomanianLayout = layouts[props.getStore().alphabet];
    this.API = props.getStore().api;
    this.step6Info = (
      <Popover id="popover-basic">
        <Popover.Header as="h4">{StepsInfo.step6Info.title}</Popover.Header>
        <Popover.Body>
          <div dangerouslySetInnerHTML={{ __html: StepsInfo.step6Info.body }} />
        </Popover.Body>
      </Popover>
    );
  }

  onChangeInput = (event) => {
    const index = parseInt(event.target.id);
    const textarea = event.target;
    const input = textarea.value;
    const caretPosition = textarea.selectionStart;

    this.state.transResults[index] = input;
    this.setState(
      (prevState) => ({
        transResults: [...prevState.transResults],
        caretPositions: {
          ...prevState.caretPositions,
          [index]: caretPosition,
        },
      }),
      () => {
        // After state is updated, update the parent store
        this.props.updateStore({ transResults: this.state.transResults });

        // Update the keyboard input
        if (this.keyboard) {
          this.keyboard.setInput(input);
        }
      }
    );
  };

  onKeyPress = (button) => {
    console.log("Button pressed", button);

    if (button === "{shift}" || button === "{lock}") {
      this.handleShift();
    } else {
      this.handleVirtualKeyboardInput(button);
    }
  };

  handleVirtualKeyboardInput = (button) => {
    const index = this.state.inputID;
    const textarea = this.textareaRefs[index];
    if (!textarea) return;

    let value = textarea.value;
    let caretPosition = this.state.caretPositions[index] || 0;

    // Handle special keys
    if (button === "{bksp}") {
      // Remove character before caret
      if (caretPosition > 0) {
        value = value.slice(0, caretPosition - 1) + value.slice(caretPosition);
        caretPosition -= 1;
      }
    } else if (button === "{enter}") {
      // Insert newline at caret position
      value = value.slice(0, caretPosition) + "\n" + value.slice(caretPosition);
      caretPosition += 1;
    } else if (button === "{space}") {
      // Insert space at caret position
      value = value.slice(0, caretPosition) + " " + value.slice(caretPosition);
      caretPosition += 1;
    } else if (button.startsWith("{") && button.endsWith("}")) {
      // Do nothing for other special keys
    } else {
      // Insert the character at caret position
      value = value.slice(0, caretPosition) + button + value.slice(caretPosition);
      caretPosition += button.length;
    }

    // Update the textarea value
    textarea.value = value;
    this.state.transResults[index] = value;

    // Update the state and parent store
    this.setState(
      (prevState) => ({
        transResults: [...prevState.transResults],
        caretPositions: {
          ...prevState.caretPositions,
          [index]: caretPosition,
        },
      }),
      () => {
        // After state is updated, update the parent store
        this.props.updateStore({ transResults: this.state.transResults });

        // Defer focus and caret position updates
        requestAnimationFrame(() => {
          textarea.focus();
          textarea.setSelectionRange(caretPosition, caretPosition);
        });
      }
    );
  };

  handleShift = () => {
    const layoutName = this.state.layoutName;
    this.setState({
      layoutName: layoutName === "default" ? "shift" : "default",
    });
  };

  setActiveInput = (event) => {
    const index = parseInt(event.target.id);
    this.setState({ inputID: index });
  };

  onInputChanged = (event, index) => {
    const caretPosition = event.target.selectionStart;
    this.setState((prevState) => ({
      caretPositions: {
        ...prevState.caretPositions,
        [index]: caretPosition,
      },
    }));
  };

  handleKeyboardButton = (showk) => {
    const keyboardButton = document.querySelector("button#keyboard-button");
    if (keyboardButton) {
      if (showk) {
        keyboardButton.classList.remove("btn-primary");
        keyboardButton.classList.add("btn-keyboard");
        return "Închide tastatura virtuală";
      }
      keyboardButton.classList.remove("btn-keyboard");
      keyboardButton.classList.add("btn-primary");
    }
    return "Deschide tastatura virtuală";
  };

  handleSubmit = () => {
    this.setState({ showNextStep: true });
  };

  // Lightbox methods
  openLightbox = (imageSrc) => {
    this.setState({
      isLightboxOpen: true,
      lightboxImageSrc: imageSrc,
    });
  };

  closeLightbox = () => {
    this.setState({
      isLightboxOpen: false,
      lightboxImageSrc: "",
    });
  };

  componentDidMount() {
    // Add click listener to hide context menu
    document.addEventListener('click', this.hideContextMenu);
  }

  componentWillUnmount() {
    // Remove click listener
    document.removeEventListener('click', this.hideContextMenu);
  }

  // Context menu handlers
  handleContextMenu = (e, index) => {
    e.preventDefault();
    
    const textarea = e.target;
    const selectedText = textarea.value.substring(
      textarea.selectionStart,
      textarea.selectionEnd
    ).trim();
    
    // Get the word under cursor if no selection
    let word = selectedText;
    if (!word) {
      const cursorPos = textarea.selectionStart;
      const text = textarea.value;
      // Find word boundaries
      let start = cursorPos;
      let end = cursorPos;
      while (start > 0 && /\S/.test(text[start - 1])) start--;
      while (end < text.length && /\S/.test(text[end])) end++;
      word = text.substring(start, end).trim();
    }
    
    if (word && this.getSearchablePdfUrl(index)) {
      this.setState({
        showContextMenu: true,
        contextMenuX: e.clientX,
        contextMenuY: e.clientY,
        selectedWord: word,
        activeDocIndex: index,
      });
    }
  };

  hideContextMenu = () => {
    this.setState({ showContextMenu: false });
  };

  getSearchablePdfUrl = (index) => {
    // Check if searchable PDF is available
    const sourceFile = this.state.s3SourceFiles[index];
    if (sourceFile?.searchablePdfUrl) {
      return sourceFile.searchablePdfUrl;
    }
    // Check store for searchable PDF URL
    const storePdfUrl = this.props.getStore().searchablePdfUrl;
    if (storePdfUrl) {
      return storePdfUrl;
    }
    // If source is PDF, it might be searchable already
    if (sourceFile?.isPdf) {
      return sourceFile.url;
    }
    return null;
  };

  searchInPdf = () => {
    const pdfUrl = this.getSearchablePdfUrl(this.state.activeDocIndex);
    if (pdfUrl && this.state.selectedWord) {
      this.setState({
        showPdfSearchModal: true,
        pdfSearchWord: this.state.selectedWord,
        showContextMenu: false,
      });
    }
  };

  closePdfSearchModal = () => {
    this.setState({
      showPdfSearchModal: false,
      pdfSearchWord: "",
    });
  };

  render() {
    const handleFilePath = (filePath) => {
      if (filePath.length > 0) return this.API + filePath;
      return "https://cdn.presslabs.com/wp-content/uploads/2018/10/upload-error.png";
    };
    return (
      <div className="step step6">
        <div className="row">
          <form id="Form" className="form-horizontal">
            <div className="form-group">
              <label className="col-md-12 control-label d-flex form-label">
                <h1>
                  Pasul 6: Verifică și editează rezultatul obținut după transliterare
                </h1>
                <OverlayTrigger
                  trigger="click"
                  rootClose
                  placement="right"
                  overlay={this.step6Info}
                >
                  <Button type="button" className="btn btn-info text-white mx-4">
                    Info
                  </Button>
                </OverlayTrigger>
              </label>
            </div>
            <div className="row mt-3">
              <div className="form-group col-md-12 content form-block-holder">
                <Accordion defaultActiveKey={0} alwaysOpen>
                  {this.state.transResults &&
                    this.state.transResults.map((item, index) => {
                      return (
                        <Accordion.Item eventKey={index} key={index}>
                          <Accordion.Header>
                            {`Rezultatul transliterării documentului ${this.state.sourceFiles[index].name}`}
                          </Accordion.Header>
                          <Accordion.Body>
                            <Row>
                              <Col sm={9}>
                                <textarea
                                  ref={(ref) => (this.textareaRefs[index] = ref)}
                                  key={index}
                                  id={index}
                                  onFocus={this.setActiveInput}
                                  onClick={(e) => {
                                    this.onInputChanged(e, index);
                                    this.hideContextMenu();
                                  }}
                                  onKeyUp={(e) => this.onInputChanged(e, index)}
                                  onSelect={(e) => this.onInputChanged(e, index)}
                                  onContextMenu={(e) => this.handleContextMenu(e, index)}
                                  value={item}
                                  onChange={this.onChangeInput}
                                  className={`form-control text ${
                                    this.state.show ? "textarea-reduced" : "textarea-normal"
                                  }`}
                                  rows="14"
                                ></textarea>
                              </Col>
                              <Col sm={3}>
                                <Col sm={12}>
                                  <button
                                    id="keyboard-button"
                                    className="btn btn-primary"
                                    type="button"
                                    title="Tastatura virtuală"
                                    onClick={() =>
                                      this.setState({ show: !this.state.show })
                                    }
                                  >
                                    {this.handleKeyboardButton(this.state.show)}
                                  </button>
                                  <div className="mt-3">
                                    {this.state.s3SourceFiles[index]?.isPdf ? (
                                      <div>
                                        <span>Compară rezultatul cu documentul PDF:</span>
                                        <div style={{ height: '300px', marginTop: '10px' }}>
                                          <iframe 
                                            src={this.state.s3SourceFiles[index].url}
                                            title={`PDF Document ${index + 1}`}
                                            width="100%" 
                                            height="100%" 
                                            style={{ border: '1px solid #ccc' }}
                                          />
                                        </div>
                                      </div>
                                    ) : (
                                      <span
                                        className="image-link"
                                        onClick={() =>
                                          this.openLightbox(this.state.s3SourceFiles[index].url)
                                        }
                                      >
                                        Compară rezultatul cu imaginea sursă originală:
                                        <img
                                          width="100"
                                          src={this.state.s3SourceFiles[index].url}
                                          alt="Original Source"
                                        />
                                      </span>
                                    )}
                                  </div>
                                </Col>
                              </Col>
                            </Row>
                          </Accordion.Body>
                        </Accordion.Item>
                      );
                    })}
                </Accordion>
                {this.state.show && (
                  <Keyboard
                    keyboardRef={(r) => (this.keyboard = r)}
                    layoutName={this.state.layoutName}
                    onKeyPress={this.onKeyPress}
                    layout={this.romanian.layout}
                  />
                )}
              </div>
            </div>
          </form>
        </div>
        <div className="exception-widget">
          <AddExceptionWidget
            period={this.state.period}
            onGetDictionary={getDictionary}
          />
        </div>
        <Row className="mt-2">
          <Col>
            <Button className="save-trans float-end" onClick={this.handleSubmit}>
              Salvează modificările
            </Button>
          </Col>
          <Col>
            {this.state.showNextStep && (
              <>
                {(document.querySelector(".save-trans").disabled = true)}
                <Button
                  variant="primary mx-4"
                  onClick={() => this.props.jumpToStep(6)}
                >
                  Mergi la pasul următor - salvează rezultatele finale
                </Button>
              </>
            )}
          </Col>
        </Row>

        {/* Lightbox Component */}
        {this.state.isLightboxOpen && (
          <ReactImageLightbox
            mainSrc={this.state.lightboxImageSrc}
            onCloseRequest={this.closeLightbox}
          />
        )}

        {/* Context Menu for word search in PDF */}
        {this.state.showContextMenu && (
          <div
            className="context-menu"
            style={{
              position: 'fixed',
              top: this.state.contextMenuY,
              left: this.state.contextMenuX,
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
              zIndex: 1000,
              padding: '5px 0',
            }}
          >
            <div
              className="context-menu-item"
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
              }}
              onClick={this.searchInPdf}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
            >
              🔍 Caută "{this.state.selectedWord}" în PDF
            </div>
          </div>
        )}

        {/* PDF Search Modal */}
        {this.state.showPdfSearchModal && (
          <PdfViewerWithSearch
            url={this.getSearchablePdfUrl(this.state.activeDocIndex)}
            title="Document PDF - Căutare"
            searchWord={this.state.pdfSearchWord}
            onClose={this.closePdfSearchModal}
          />
        )}
      </div>
    );
  }
}

export default Step6;
