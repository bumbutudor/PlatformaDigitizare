import React, { Component, useRef } from "react";
import {
  Editor,
  EditorState,
  getDefaultKeyBinding,
  RichUtils,
  ContentState,
  convertFromHTML,
} from "draft-js";
import "./RichText.css";
import "../../node_modules/draft-js/dist/Draft.css";

import PropTypes from "prop-types";
import Keyboard from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import layouts from "../components/KeyboardLayouts";

class RichTextEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      editorState: EditorState.createWithContent(
        ContentState.createFromBlockArray(convertFromHTML(props.editorState))
      ),
      showk: false,
      layoutName: "default",
    };

    this.focus = () => this.refs.editor.focus();
    this.onChange = (editorState) => this.setState({ editorState });

    this.handleKeyCommand = this._handleKeyCommand.bind(this);
    this.mapKeyToEditorCommand = this._mapKeyToEditorCommand.bind(this);
    this.toggleBlockType = this._toggleBlockType.bind(this);
    this.toggleInlineStyle = this._toggleInlineStyle.bind(this);
    this.cyrillicRomanianLayout = layouts[props.getStore().alphabet];
    console.log(this.state.showk);
  }

  onChangeKeyboardInput(input, a) {
    console.log(input, a);
    const inputID = this.state.inputID;
    const ocrResults = this.state.ocrResults;
    ocrResults[inputID] = input;
    this.setState({ ocrResults: [...ocrResults] });
  }

  onKeyPress(button) {
    if (button === "{shift}" || button === "{lock}") this.handleShift();
  }

  onChange(e) {
    let newState = {};
    newState[e.target.name] = e.target.value;
    this.setState(newState);
  }

  _handleKeyCommand(command, editorState) {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.onChange(newState);
      return true;
    }
    return false;
  }

  _mapKeyToEditorCommand(e) {
    if (e.keyCode === 9) {
      const newEditorState = RichUtils.onTab(e, this.state.editorState, 4);
      if (newEditorState !== this.state.editorState) {
        this.onChange(newEditorState);
      }
      return;
    }
    return getDefaultKeyBinding(e);
  }

  _toggleBlockType(blockType) {
    this.onChange(RichUtils.toggleBlockType(this.state.editorState, blockType));
  }

  _toggleInlineStyle(inlineStyle) {
    this.onChange(
      RichUtils.toggleInlineStyle(this.state.editorState, inlineStyle)
    );
  }

  render() {
    const { editorState } = this.state;
    // If the user changes block type before entering any text, we can
    // either style the placeholder or hide it. Let's just hide it now.
    let className = "RichEditor-editor";
    var contentState = editorState.getCurrentContent();
    if (!contentState.hasText()) {
      if (contentState.getBlockMap().first().getType() !== "unstyled") {
        className += " RichEditor-hidePlaceholder";
      }
    }
    return (
      <div className="RichEditor-root">
        <BlockStyleControls
          editorState={editorState}
          onToggle={this.toggleBlockType}
        />
        <InlineStyleControls
          state={this.state}
          editorState={editorState}
          onToggle={this.toggleInlineStyle}
        />
        <div className={className} onClick={this.focus}>
          <Editor
            blockStyleFn={getBlockStyle}
            customStyleMap={styleMap}
            editorState={editorState}
            handleKeyCommand={this.handleKeyCommand}
            keyBindingFn={this.mapKeyToEditorCommand}
            onChange={this.onChange}
            placeholder="Tell a story..."
            ref="editor"
            spellCheck={true}
            value="123"
          />
        </div>
        {this.state.showk && (
          <Keyboard
            keyboardRef={(r) => (this.keyboard = r)}
            layoutName={this.state.layoutName}
            onChange={(inputs) =>
              this.onChangeKeyboardInput(
                inputs,
                this.state.ocrResults[this.state.inputID]
              ).bind(this)
            }
            onKeyPress={this.onKeyPress.bind(this)}
            layout={this.cyrillicRomanianLayout.layout}
          />
        )}
      </div>
    );
  }
}

// Custom overrides for "code" style.
const styleMap = {
  CODE: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
    fontSize: 16,
    padding: 2,
  },
};

function getBlockStyle(block) {
  switch (block.getType()) {
    case "blockquote":
      return "RichEditor-blockquote";
    default:
      return null;
  }
}

class StyleButton extends React.Component {
  constructor() {
    super();
    this.onToggle = (e) => {
      e.preventDefault();
      this.props.onToggle(this.props.style);
    };
  }

  render() {
    let className = "RichEditor-styleButton";
    if (this.props.active) {
      className += " RichEditor-activeButton";
    }

    return (
      <span className={className} onMouseDown={this.onToggle}>
        {this.props.label}
      </span>
    );
  }
}

const BLOCK_TYPES = [
  { label: "H1", style: "header-one" },
  { label: "H2", style: "header-two" },
  { label: "H3", style: "header-three" },
  /* { label: "H4", style: "header-four" },
  { label: "H5", style: "header-five" },
  { label: "H6", style: "header-six" },
  { label: "Blockquote", style: "blockquote" }, */
  { label: "UL", style: "unordered-list-item" },
  { label: "OL", style: "ordered-list-item" },
  /* { label: "Code Block", style: "code-block" }, */
];

const BlockStyleControls = (props) => {
  const { editorState } = props;
  const selection = editorState.getSelection();
  const blockType = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey())
    .getType();

  return (
    <div className="RichEditor-controls">
      {BLOCK_TYPES.map((type) => (
        <StyleButton
          key={type.label}
          active={type.style === blockType}
          label={type.label}
          onToggle={props.onToggle}
          style={type.style}
        />
      ))}
    </div>
  );
};

var INLINE_STYLES = [
  { label: "Bold", style: "BOLD" },
  { label: "Italic", style: "ITALIC" },
  { label: "Underline", style: "UNDERLINE" },
  /* { label: "Monospace", style: "CODE" }, */
  /* { label: "Keyboard", style: "CODE" }, */
];

const InlineStyleControls = (props) => {
  const currentStyle = props.editorState.getCurrentInlineStyle();
  /* console.log(this.setState()); */
  return (
    <div className="RichEditor-controls">
      {INLINE_STYLES.map((type) => (
        <StyleButton
          key={type.label}
          active={currentStyle.has(type.style)}
          label={type.label}
          onToggle={props.onToggle}
          style={type.style}
        />
      ))}
      <button
        className="btn-rch RichEditor-styleButton"
        type="button"
        title="Tatstatura Virtuală"
        onClick={() => (props.state.showk = !props.state.showk)}
      >
        keyboard
        {/* <svg className="svg_keyboard" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M19,10H17V8H19M19,13H17V11H19M16,10H14V8H16M16,13H14V11H16M16,17H8V15H16M7,10H5V8H7M7,13H5V11H7M8,11H10V13H8M8,8H10V10H8M11,11H13V13H11M11,8H13V10H11M20,5H4C2.89,5 2,5.89 2,7V17A2,2 0 0,0 4,19H20A2,2 0 0,0 22,17V7C22,5.89 21.1,5 20,5Z"
          />
        </svg> */}
      </button>
    </div>
  );
};

export default RichTextEditor;
