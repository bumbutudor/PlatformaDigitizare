"use strict";

import React, { Component } from "react";
import PropTypes from "prop-types";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import layouts from "../components/KeyboardLayouts";
import Accordion from "react-bootstrap/Accordion";
import Button from "react-bootstrap/Button";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import StepsInfo from "../components/StepsInfo";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import ReactImageLightbox from "react-image-lightbox";
import "react-image-lightbox/style.css";
import Modal from "react-bootstrap/Modal";

// Note: Using media-proxy to bypass X-Frame-Options restrictions from ngrok

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

// Panel lateral pentru vizualizare document original cu resize și polling pentru PDF
class DocumentPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      width: 45, // procent
      isResizing: false,
      pollingPdfUrl: null, // URL găsit prin polling
      isPolling: false,
      pollingMessage: '',
      useSearchablePdf: false, // Flag pentru a folosi PDF searchable când e disponibil
    };
    this.panelRef = React.createRef();
    this.pollingInterval = null;
    this.pollingStartTime = null;
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

  componentDidMount() {
    this.startPollingForSearchablePdf();
  }

  componentDidUpdate(prevProps) {
    // Restart polling if panel reopens or file changes
    if (this.props.isOpen && !prevProps.isOpen) {
      this.setState({ pollingPdfUrl: null, useSearchablePdf: false });
      this.startPollingForSearchablePdf();
    }
    // Dacă fileName s-a schimbat, resetăm și repornim polling
    if (this.props.fileName !== prevProps.fileName) {
      this.setState({ pollingPdfUrl: null, useSearchablePdf: false });
      this.startPollingForSearchablePdf();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    this.stopPolling();
  }

  startPollingForSearchablePdf = () => {
    const { pdfUrl, fileName, period, apiBase } = this.props;
    
    // Dacă avem deja un PDF searchable din props, îl folosim direct
    if (pdfUrl) {
      this.setState({ useSearchablePdf: true });
      return;
    }
    
    // Dacă avem fileName și period, începem polling în fundal
    if (fileName && period && apiBase) {
      this.pollingStartTime = Date.now();
      this.setState({ 
        isPolling: true, 
        pollingMessage: 'Se caută PDF-ul searchable...' 
      });
      
      // Verificăm imediat o dată
      this.checkForPdf();
      
      // Apoi continuăm polling la fiecare 5 secunde (mărit de la 3)
      this.pollingInterval = setInterval(() => {
        this.checkForPdf();
      }, 5000);
    }
  };

  stopPolling = () => {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.setState({ isPolling: false, pollingMessage: '' });
  };

  checkForPdf = async () => {
    const { fileName, period, alphabet, apiBase } = this.props;
    
    try {
      const params = new URLSearchParams({
        file_name: fileName,
        period: period,
        alphabet: alphabet || ''
      });
      
      const response = await fetch(`${apiBase}check-pdf/?${params}`);
      const data = await response.json();
      
      if (data.exists && data.pdfUrl) {
        const fullPdfUrl = `${apiBase}${data.pdfUrl.startsWith('/') ? data.pdfUrl.slice(1) : data.pdfUrl}`;
        this.setState({ 
          pollingPdfUrl: fullPdfUrl,
          useSearchablePdf: true,
          isPolling: false,
          pollingMessage: ''
        });
        this.stopPolling();
      } else {
        // Actualizăm mesajul cu timpul trecut și status
        const elapsedSeconds = Math.floor((Date.now() - this.pollingStartTime) / 1000);
        let statusMessage = 'Se caută PDF-ul searchable...';
        
        if (data.status === 'still_writing') {
          statusMessage = 'PDF se generează, așteptăm finalizarea...';
        } else if (data.status === 'empty_file') {
          statusMessage = 'PDF detectat, se așteaptă scrierea conținutului...';
        }
        
        this.setState({
          pollingMessage: `${statusMessage} (${elapsedSeconds}s)`
        });
        
        // Oprim după 3 minute de polling
        if (elapsedSeconds > 180) {
          this.stopPolling();
        }
      }
    } catch (error) {
      console.error('Error checking for PDF:', error);
    }
  };

  render() {
    const { isOpen, onClose, pdfUrl, imageUrl, searchQuery, title, apiBase } = this.props;
    const { pollingPdfUrl, isPolling, pollingMessage, useSearchablePdf } = this.state;
    
    if (!isOpen) return null;
    
    // Determinăm ce să afișăm:
    // 1. Dacă avem PDF searchable (din props sau polling), îl folosim
    // 2. Altfel, afișăm imaginea originală
    const effectivePdfUrl = useSearchablePdf ? (pollingPdfUrl || pdfUrl) : null;
    
    // Convert URLs to proxy URLs to bypass X-Frame-Options
    const proxyPdfUrl = getProxyUrl(effectivePdfUrl, apiBase);
    const proxyImageUrl = getProxyUrl(imageUrl, apiBase);
    
    // Afișăm PDF searchable dacă e disponibil, altfel imaginea
    const showPdf = !!proxyPdfUrl;
    const displayUrl = showPdf && searchQuery 
      ? `${proxyPdfUrl}#search=${encodeURIComponent(searchQuery)}&zoom=100`
      : proxyPdfUrl;
    
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <strong>{title || 'Document Original'}</strong>
            {isPolling && (
              <span style={{ 
                fontSize: '12px', 
                color: '#6c757d',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span className="spinner-border spinner-border-sm" role="status" />
                {pollingMessage}
              </span>
            )}
            {useSearchablePdf && (
              <span style={{ 
                fontSize: '11px', 
                color: '#28a745',
                backgroundColor: '#d4edda',
                padding: '2px 8px',
                borderRadius: '10px',
              }}>
                PDF Searchable
              </span>
            )}
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
          {showPdf ? (
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

class Step4 extends Component {
  constructor(props) {
    super(props);

    this.state = {
      ocrResults: props.getStore().ocrResults,
      sourceFiles: props.getStore().sourceFiles,
      s3SourceFiles: props.getStore().s3SourceFiles,
      preprocessedFiles: props.getStore().preprocessedFiles,
      s3PreprocessedFiles: props.getStore().s3PreprocessedFiles,
      searchablePdfUrl: props.getStore().searchablePdfUrl || null,
      period: props.getStore().period,
      alphabet: props.getStore().alphabet,
      layoutName: "default",
      showk: false,
      showNextStep: false,
      inputID: 0,
      caretPositions: {}, // Keep track of caret positions for each textarea

      isLightboxOpen: false,
      lightboxImageSrc: "",

      keyboardLayout: null, // State to hold the dynamic keyboard layout
      
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
    this.API = this.props.getStore().api;

    const selectedAlphabet = props.getStore().alphabet;
    this.baseLayout = layouts[selectedAlphabet];

    if (!this.baseLayout) {
      console.warn(
        `Keyboard layout for "${selectedAlphabet}" not found. Using default layout.`
      );
      this.baseLayout = layouts["cyrillicRomanian"];
    }

    this.step4Info = (
      <Popover id="popover-basic">
        <Popover.Header as="h4">{StepsInfo.step4Info.title}</Popover.Header>
        <Popover.Body>
          <div
            dangerouslySetInnerHTML={{ __html: StepsInfo.step4Info.body }}
          />
        </Popover.Body>
      </Popover>
    );
  }

  componentDidMount() {
    // After component mounts, generate the dynamic keyboard layout
    this.generateDynamicKeyboardLayout();
  }

  componentDidUpdate(prevProps, prevState) {
    // If ocrResults change, regenerate the keyboard layout
    if (prevState.ocrResults !== this.state.ocrResults) {
      this.generateDynamicKeyboardLayout();
    }
  }

  componentWillUnmount() {
    // Cleanup if needed
  }

  // Function to generate the dynamic keyboard layout
  generateDynamicKeyboardLayout = () => {
    const { ocrResults } = this.state;

    // Extract unique letters from OCR text
    const ocrLetters = this.extractUniqueLettersFromText(ocrResults);

    // Extract letters from the base keyboard layout
    const layoutLetters = this.extractLettersFromLayout(this.baseLayout.layout);

    // Find missing letters
    const missingLetters = ocrLetters.filter(
      (letter) => !layoutLetters.includes(letter)
    );

    if (missingLetters.length > 0) {
      // Extend the keyboard layout
      const newLayout = this.extendKeyboardLayout(
        this.baseLayout.layout,
        missingLetters
      );

      // Update the state with the new layout
      this.setState({ keyboardLayout: newLayout });
    } else {
      // No missing letters, use the base layout
      this.setState({ keyboardLayout: this.baseLayout.layout });
    }
  };

  // Function to extract unique letters from OCR text
  extractUniqueLettersFromText = (textArray) => {
    const text = textArray.join("");
    const letters = new Set();
    for (const char of text) {
      if (this.isLetter(char)) {
        letters.add(char.toLowerCase()); // Convert to lowercase
      }
    }
    return Array.from(letters);
  };

  // Helper function to check if a character is a letter
  isLetter = (char) => {
    // Exclude common punctuation and whitespace
    return /[^\s\d.,:;!?()\[\]{}"'`~@#$%^&*_=+<>\\\/|-]/.test(char);
  };

  // Function to extract letters from the keyboard layout
  extractLettersFromLayout = (layout) => {
    const letters = new Set();
    Object.values(layout).forEach((rowArray) => {
      rowArray.forEach((row) => {
        const keys = row.split(" ");
        keys.forEach((key) => {
          // Ignore special keys like {shift}, {space}, etc.
          if (!key.startsWith("{") && !key.endsWith("}")) {
            letters.add(key);
          }
        });
      });
    });
    return Array.from(letters);
  };

  // Function to extend the keyboard layout
  extendKeyboardLayout = (originalLayout, missingLetters) => {
    // Clone the original layout to avoid mutating it
    const newLayout = JSON.parse(JSON.stringify(originalLayout));

    // Join missing letters into a string
    const additionalKeys = missingLetters.join(" ");

    // Function to add additional keys after '{space}'
    const addKeysAfterSpace = (layoutRows, lettersToAdd) => {
      return layoutRows.map((row) => {
        if (row.includes("{space}")) {
          return row.replace("{space}", `{space} ${lettersToAdd}`);
        } else {
          return row;
        }
      });
    };

    // Add to 'default' layout
    if (newLayout.default) {
      newLayout.default = addKeysAfterSpace(newLayout.default, additionalKeys);
    }

    // For 'shift' layout, handle uppercase versions
    if (newLayout.shift) {
      const uppercaseLetters = missingLetters
        .map((char) => char.toUpperCase())
        .join(" ");
      newLayout.shift = addKeysAfterSpace(newLayout.shift, uppercaseLetters);
    }

    return newLayout;
  };

  onChangeInput = (event) => {
    const index = parseInt(event.target.id);
    const textarea = event.target;
    const input = textarea.value;
    const caretPosition = textarea.selectionStart;

    this.state.ocrResults[index] = input;
    this.setState(
      (prevState) => ({
        ocrResults: [...prevState.ocrResults],
        caretPositions: {
          ...prevState.caretPositions,
          [index]: caretPosition,
        },
      }),
      () => {
        // After state is updated, update the parent store
        this.props.updateStore({ ocrResults: this.state.ocrResults });

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
        value =
          value.slice(0, caretPosition - 1) + value.slice(caretPosition);
        caretPosition -= 1;
      }
    } else if (button === "{enter}") {
      // Insert newline at caret position
      value =
        value.slice(0, caretPosition) + "\n" + value.slice(caretPosition);
      caretPosition += 1;
    } else if (button === "{space}") {
      // Insert space at caret position
      value =
        value.slice(0, caretPosition) + " " + value.slice(caretPosition);
      caretPosition += 1;
    } else if (button.startsWith("{") && button.endsWith("}")) {
      // Do nothing for other special keys
    } else {
      // Insert the character at caret position
      value =
        value.slice(0, caretPosition) + button + value.slice(caretPosition);
      caretPosition += button.length;
    }

    // Update the textarea value
    textarea.value = value;
    this.state.ocrResults[index] = value;

    // Update the state and parent store
    this.setState(
      (prevState) => ({
        ocrResults: [...prevState.ocrResults],
        caretPositions: {
          ...prevState.caretPositions,
          [index]: caretPosition,
        },
      }),
      () => {
        // After state is updated, update the parent store
        this.props.updateStore({ ocrResults: this.state.ocrResults });

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

  // Double-click handler - deschide panelul cu căutare precisă
  handleDoubleClick = (e, index) => {
    const textarea = e.target;
    const cursorPos = textarea.selectionStart;
    const text = textarea.value;
    
    // Find word boundaries
    let wordStart = cursorPos;
    let wordEnd = cursorPos;
    while (wordStart > 0 && /\S/.test(text[wordStart - 1])) wordStart--;
    while (wordEnd < text.length && /\S/.test(text[wordEnd])) wordEnd++;
    const word = text.substring(wordStart, wordEnd).trim();
    
    if (!word) return;
    
    // Selectăm cuvântul în textarea
    textarea.setSelectionRange(wordStart, wordEnd);
    
    // Căutăm doar cuvântul exact (fără spații care creează căutări multiple)
    const searchQuery = word;
    
    const pdfUrl = this.getSearchablePdfUrl(index);
    const sourceFile = this.state.s3SourceFiles[index];
    
    // Dacă avem PDF sau imagine, deschidem panelul
    if (pdfUrl || sourceFile?.url) {
      this.setState({
        showDocumentPanel: true,
        selectedWord: word,
        searchQuery: searchQuery,
        activeDocIndex: index,
        documentPanelTitle: `Verificare: "${word}"`,
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

  hideSearchTooltip = () => {
    this.setState({ showSearchTooltip: false });
  };

  render() {
    return (
      <div className="step step4">
        <div className="row">
          <form id="Form" className="form-horizontal">
            <div className="form-group">
              <label className="control-label col-md-12 d-flex">
                <h1>Pasul 4: Verifică și editează textul recunoscut</h1>
                <OverlayTrigger
                  trigger="click"
                  rootClose
                  placement="right"
                  overlay={this.step4Info}
                >
                  <Button
                    type="button"
                    className="btn btn-info text-white mx-4"
                  >
                    Info
                  </Button>
                </OverlayTrigger>
              </label>
            </div>
            <div className="row mt-3">
              <div className="form-group col-md-12 content form-block-holder">
                <Accordion defaultActiveKey={0} alwaysOpen>
                  {this.state.ocrResults.length > 0 &&
                    this.state.ocrResults.map((item, index) => {
                      return (
                        <Accordion.Item eventKey={index} key={index}>
                          <Accordion.Header>
                            {`Rezultatul OCR pentru documentul ${
                              this.state.sourceFiles[index].name
                            }`}
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
                                    this.state.showk
                                      ? "textarea-reduced"
                                      : "textarea-normal"
                                  }`}
                                  rows="12"
                                  spellCheck="false"
                                ></textarea>
                              </Col>
                              <Col sm={3}>
                                <Col sm={12}>
                                  <button
                                    id="keyboard-button"
                                    className="btn btn-primary"
                                    type="button"
                                    title="Tastatura Virtuală"
                                    onClick={() =>
                                      this.setState({
                                        showk: !this.state.showk,
                                      })
                                    }
                                  >
                                    {this.handleKeyboardButton(
                                      this.state.showk
                                    )}
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
                                    <div style={{ fontSize: '12px', color: '#6c757d' }}>
                                      💡 Dublu-click pe un cuvânt din text pentru a-l căuta în document
                                    </div>
                                    {!this.state.s3SourceFiles[index]?.isPdf && (
                                      <span
                                        className="image-link"
                                        onClick={() =>
                                          this.openLightbox(
                                            this.state.s3SourceFiles[index].url
                                          )
                                        }
                                        style={{ display: 'block', marginTop: '10px' }}
                                      >
                                        <small className="text-muted">Click pentru imagine mărită:</small>
                                        <img
                                          width="100"
                                          src={
                                            this.state.s3SourceFiles[index].url
                                          }
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

                {this.state.showk && this.state.keyboardLayout && (
                  <Keyboard
                    keyboardRef={(r) => (this.keyboard = r)}
                    layoutName={this.state.layoutName}
                    onKeyPress={this.onKeyPress}
                    layout={this.state.keyboardLayout}
                    display={{
                      "{bksp}": "backspace",
                      "{enter}": "enter",
                      "{shift}": "shift",
                      "{space}": "space",
                      "{tab}": "tab",
                      "{lock}": "caps lock",
                    }}
                    buttonTheme={[
                      {
                        class: "hg-spacebar",
                        buttons: "{space}",
                      },
                    ]}
                  />
                )}
              </div>
            </div>
          </form>
        </div>

        <Row className="mt-2">
          <Col>
            <Button
              className="save-ocr float-end"
              onClick={this.handleSubmit}
            >
              Salvează modificările
            </Button>
            <span className="text-muted mx-2 mt-2 float-end">
              Ai verificat textul? Dacă da atunci{" "}
            </span>
          </Col>
          <Col>
            {this.state.showNextStep && (
              <>
                {(document.querySelector(".save-ocr").disabled = true)}
                <Button
                  variant="primary mx-4"
                  onClick={() => this.props.jumpToStep(4)}
                >
                  Mergi la pasul următor - transliterarea textului verificat
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
          fileName={this.state.sourceFiles[this.state.activeDocIndex]?.name}
          period={this.state.period}
          alphabet={this.state.alphabet}
        />
      </div>
    );
  }
}

export default Step4;
