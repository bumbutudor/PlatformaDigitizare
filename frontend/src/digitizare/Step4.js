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

// PDF Viewer Component
const PdfViewer = ({ url, title }) => (
  <div className="pdf-viewer-container" style={{ height: '500px', width: '100%' }}>
    <iframe 
      src={url} 
      title={title}
      width="100%" 
      height="100%" 
      style={{ border: '1px solid #ccc' }}
    />
  </div>
);

class Step4 extends Component {
  constructor(props) {
    super(props);

    this.state = {
      ocrResults: props.getStore().ocrResults,
      sourceFiles: props.getStore().sourceFiles,
      s3SourceFiles: props.getStore().s3SourceFiles,
      preprocessedFiles: props.getStore().preprocessedFiles,
      s3PreprocessedFiles: props.getStore().s3PreprocessedFiles,
      layoutName: "default",
      showk: false,
      showNextStep: false,
      inputID: 0,
      caretPositions: {}, // Keep track of caret positions for each textarea

      isLightboxOpen: false,
      lightboxImageSrc: "",

      keyboardLayout: null, // State to hold the dynamic keyboard layout
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
                                  onClick={(e) => this.onInputChanged(e, index)}
                                  onKeyUp={(e) => this.onInputChanged(e, index)}
                                  onSelect={(e) => this.onInputChanged(e, index)}
                                  value={item}
                                  onChange={this.onChangeInput}
                                  className={`form-control text ${
                                    this.state.showk
                                      ? "textarea-reduced"
                                      : "textarea-normal"
                                  }`}
                                  rows="12"
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
                                    {this.state.s3SourceFiles[index]?.isPdf ? (
                                      <div>
                                        <span>Compară rezultatul OCR cu documentul PDF:</span>
                                        <PdfViewer 
                                          url={this.state.s3SourceFiles[index].url} 
                                          title={`PDF Document ${index + 1}`}
                                        />
                                      </div>
                                    ) : (
                                      <span
                                        className="image-link"
                                        onClick={() =>
                                          this.openLightbox(
                                            this.state.s3SourceFiles[index].url
                                          )
                                        }
                                      >
                                        Compară rezultatul OCR cu imaginea sursă
                                        originală:
                                        <img
                                          width="100"
                                          src={
                                            this.state.s3SourceFiles[index].url
                                          }
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
      </div>
    );
  }
}

export default Step4;
