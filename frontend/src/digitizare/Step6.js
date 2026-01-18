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

// Helper function to convert media URL to proxy URL
const getProxyUrl = (url, apiBase) => {
  if (!url) return null;
  // Extract path after /media/
  const mediaMatch = url.match(/\/media\/(.+)$/);
  if (mediaMatch) {
    // Use the proxy endpoint
    return `${apiBase}media-proxy/${mediaMatch[1]}`;
  }
  return url;
};

// Panel lateral pentru vizualizare document original cu resize
class DocumentPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      width: 45, // procent
      isResizing: false,
    };
    this.panelRef = React.createRef();
  }

  handleMouseDown = (e) => {
    e.preventDefault();
    this.setState({ isResizing: true });
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
  };

  handleMouseMove = (e) => {
    if (!this.state.isResizing) return;
    
    const windowWidth = window.innerWidth;
    const newWidth = ((windowWidth - e.clientX) / windowWidth) * 100;
    
    // Limităm între 25% și 80%
    if (newWidth >= 25 && newWidth <= 80) {
      this.setState({ width: newWidth });
    }
  };

  handleMouseUp = () => {
    this.setState({ isResizing: false });
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
  };

  componentWillUnmount() {
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
  }

  render() {
    const { isOpen, onClose, pdfUrl, imageUrl, searchQuery, title, apiBase } = this.props;
    
    if (!isOpen) return null;
    
    // Convert URLs to proxy URLs to bypass X-Frame-Options
    const proxyPdfUrl = getProxyUrl(pdfUrl, apiBase);
    const proxyImageUrl = getProxyUrl(imageUrl, apiBase);
    
    const documentUrl = proxyPdfUrl || proxyImageUrl;
    const isPdf = !!proxyPdfUrl;
    
    // Construim URL-ul cu parametru de căutare pentru PDF
    const displayUrl = isPdf && searchQuery 
      ? `${documentUrl}#search=${encodeURIComponent(searchQuery)}&zoom=100`
      : documentUrl;
    
    return (
      <div 
        ref={this.panelRef}
        className="document-panel"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: `${this.state.width}%`,
          height: '100vh',
          backgroundColor: 'white',
          boxShadow: '-4px 0 20px rgba(0,0,0,0.3)',
          zIndex: 1050,
          display: 'flex',
          flexDirection: 'column',
          userSelect: this.state.isResizing ? 'none' : 'auto',
        }}
      >
        {/* Resize Handle */}
        <div
          onMouseDown={this.handleMouseDown}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '6px',
            height: '100%',
            cursor: 'ew-resize',
            backgroundColor: this.state.isResizing ? '#007bff' : 'transparent',
            transition: 'background-color 0.2s',
            zIndex: 1051,
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#007bff'}
          onMouseLeave={(e) => !this.state.isResizing && (e.target.style.backgroundColor = 'transparent')}
          title="Trage pentru a redimensiona"
        />
        
        {/* Header */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #dee2e6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8f9fa',
        }}>
          <div>
            <strong>{title || 'Document Original'}</strong>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0 8px',
              color: '#6c757d',
            }}
            title="Închide panoul"
          >
            ×
          </button>
        </div>
        
        {/* Document Content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {isPdf ? (
            <iframe
              src={displayUrl}
              title={title}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
              spellCheck={false}
            />
          ) : proxyImageUrl ? (
            <div style={{ 
              height: '100%', 
              overflow: 'auto', 
              display: 'flex', 
              justifyContent: 'center',
              padding: '10px',
            }}>
              <img
                src={proxyImageUrl}
                alt="Document original"
                style={{ maxWidth: '100%', height: 'auto', objectFit: 'contain' }}
              />
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
              Nu există document disponibil pentru verificare.
            </div>
          )}
        </div>
      </div>
    );
  }
}

// Overlay pentru click în afară
const PanelOverlay = ({ isOpen, onClick }) => {
  if (!isOpen) return null;
  return (
    <div
      onClick={onClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        zIndex: 1040,
      }}
    />
  );
};

class Step6 extends Component {
  constructor(props) {
    super(props);

    this.state = {
      transResults: props.getStore().transResults,
      ocrResults: props.getStore().ocrResults, // Textul OCR original (chirilic)
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
      
      // Search tooltip state (shown on double-click)
      showSearchTooltip: false,
      tooltipX: 0,
      tooltipY: 0,
      selectedWord: "",
      selectedLineNumber: 1,
      activeDocIndex: 0,
      
      // Panel lateral pentru verificare document
      showDocumentPanel: false,
      searchQuery: "",  // Cuvântul + 2 caractere din stânga și dreapta
      documentPanelTitle: "",
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
    // Component mounted
  }

  componentWillUnmount() {
    // Cleanup if needed
  }

  // Double-click handler - deschide panelul cu căutare în documentul original
  handleDoubleClick = (e, index) => {
    const textarea = e.target;
    const cursorPos = textarea.selectionStart;
    const transText = textarea.value; // Text transliterat
    const ocrText = this.state.ocrResults[index] || ''; // Text OCR original (chirilic)
    
    // Find word boundaries in transliterated text
    let wordStart = cursorPos;
    let wordEnd = cursorPos;
    while (wordStart > 0 && /\S/.test(transText[wordStart - 1])) wordStart--;
    while (wordEnd < transText.length && /\S/.test(transText[wordEnd])) wordEnd++;
    const transWord = transText.substring(wordStart, wordEnd).trim();
    
    if (!transWord) return;
    
    // Selectăm cuvântul în textarea
    textarea.setSelectionRange(wordStart, wordEnd);
    
    // Mapăm cuvântul transliterat la cel original din OCR
    // Numărăm al câtelea cuvânt e în textul transliterat
    const transWordsBeforeCursor = transText.substring(0, wordStart).split(/\s+/).filter(w => w.length > 0);
    const wordIndex = transWordsBeforeCursor.length;
    
    // Găsim cuvântul corespunzător din textul OCR
    const ocrWords = ocrText.split(/\s+/).filter(w => w.length > 0);
    const originalWord = ocrWords[wordIndex] || transWord; // Fallback la cuvântul transliterat
    
    // Căutăm în PDF după cuvântul original (chirilic)
    const searchQuery = originalWord;
    
    const pdfUrl = this.getSearchablePdfUrl(index);
    const sourceFile = this.state.s3SourceFiles[index];
    
    // Dacă avem PDF sau imagine, deschidem panelul
    if (pdfUrl || sourceFile?.url) {
      this.setState({
        showDocumentPanel: true,
        selectedWord: transWord,
        searchQuery: searchQuery,
        activeDocIndex: index,
        documentPanelTitle: `Verificare: "${transWord}" → "${originalWord}"`,
      });
    }
  };

  hideSearchTooltip = () => {
    this.setState({ showSearchTooltip: false });
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

  // Deschide panelul lateral cu documentul
  openDocumentPanel = (index) => {
    const sourceFile = this.state.s3SourceFiles[index];
    this.setState({
      showDocumentPanel: true,
      activeDocIndex: index,
      searchContext: '',
      documentPanelTitle: `Document original: ${sourceFile?.name || 'Document ' + (index + 1)}`,
    });
  };

  closeDocumentPanel = () => {
    this.setState({
      showDocumentPanel: false,
      searchContext: '',
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
                                    this.hideSearchTooltip();
                                  }}
                                  onKeyUp={(e) => this.onInputChanged(e, index)}
                                  onSelect={(e) => this.onInputChanged(e, index)}
                                  onDoubleClick={(e) => this.handleDoubleClick(e, index)}
                                  value={item}
                                  onChange={this.onChangeInput}
                                  className={`form-control text ${
                                    this.state.show ? "textarea-reduced" : "textarea-normal"
                                  }`}
                                  rows="14"
                                  spellCheck="false"
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
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() => this.openDocumentPanel(index)}
                                      style={{ marginBottom: '10px' }}
                                    >
                                      📄 Deschide documentul original pentru verificare
                                    </Button>
                                    <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '10px' }}>
                                      💡 Dublu-click pe un cuvânt din text pentru a-l căuta în document
                                    </div>
                                    {!this.state.s3SourceFiles[index]?.isPdf && (
                                      <span
                                        className="image-link"
                                        onClick={() =>
                                          this.openLightbox(this.state.s3SourceFiles[index].url)
                                        }
                                      >
                                        <small className="text-muted">Click pentru imagine mărită:</small>
                                        <img
                                          width="100"
                                          src={this.state.s3SourceFiles[index].url}
                                          alt="Original Source"
                                          style={{ display: 'block', marginTop: '5px' }}
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

        {/* Panel lateral pentru verificare document */}
        <PanelOverlay 
          isOpen={this.state.showDocumentPanel} 
          onClick={this.closeDocumentPanel} 
        />
        <DocumentPanel
          isOpen={this.state.showDocumentPanel}
          onClose={this.closeDocumentPanel}
          pdfUrl={this.getSearchablePdfUrl(this.state.activeDocIndex)}
          imageUrl={this.state.s3SourceFiles[this.state.activeDocIndex]?.url}
          searchQuery={this.state.searchQuery}
          title={this.state.documentPanelTitle}
          apiBase={this.API}
        />
      </div>
    );
  }
}

export default Step6;
