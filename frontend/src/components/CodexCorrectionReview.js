"use strict";

import React, { Component } from "react";
import Button from "react-bootstrap/Button";
import Spinner from "react-bootstrap/Spinner";


const CODEX_ACCESS_STORAGE_KEY = "digitizare.codexAccessKey";


export default class CodexCorrectionReview extends Component {
  constructor(props) {
    super(props);
    this.state = {
      phase: "idle",
      baseText: props.targetText || "",
      suggestions: [],
      history: [],
      message: "",
      reviewStatus: "",
      fidelity: null,
      accessKeyDraft: "",
      showAccessKeyInput: false,
    };
    this._mounted = false;
    this._requestId = 0;
    this._memoryAccessKey = "";
  }

  componentDidMount() {
    this._mounted = true;
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.task !== this.props.task
      || prevProps.imageRef !== this.props.imageRef
      || prevProps.pageId !== this.props.pageId
    ) {
      this._requestId += 1;
      this.setState({
        phase: "idle",
        baseText: this.props.targetText || "",
        suggestions: [],
        history: [],
        message: "",
        reviewStatus: "",
        fidelity: null,
      });
      return;
    }
    if (prevProps.targetText !== this.props.targetText) {
      const reviewedText = this.composeText(
        this.state.baseText,
        this.state.suggestions
      );
      if (this.props.targetText !== reviewedText) {
        this._requestId += 1;
        this.setState({
          phase: "idle",
          baseText: this.props.targetText || "",
          suggestions: [],
          history: [],
          message: "",
          reviewStatus: "",
          fidelity: null,
        });
      }
    }
  }

  componentWillUnmount() {
    this._mounted = false;
    this._requestId += 1;
  }

  readStoredAccessKey() {
    if (typeof window === "undefined" || !window.sessionStorage) return "";
    try {
      return window.sessionStorage.getItem(CODEX_ACCESS_STORAGE_KEY) || "";
    } catch (error) {
      return "";
    }
  }

  storeAccessKey(accessKey) {
    this._memoryAccessKey = accessKey;
    if (typeof window === "undefined" || !window.sessionStorage) return;
    try {
      window.sessionStorage.setItem(CODEX_ACCESS_STORAGE_KEY, accessKey);
    } catch (error) {
      // The key remains usable in component state for this page instance.
    }
  }

  removeStoredAccessKey() {
    if (typeof window === "undefined" || !window.sessionStorage) return;
    try {
      window.sessionStorage.removeItem(CODEX_ACCESS_STORAGE_KEY);
    } catch (error) {
      // Storage may be disabled; clearing component state is still sufficient.
    }
  }

  getAccessKey() {
    return this._memoryAccessKey || this.readStoredAccessKey();
  }

  forgetAccessKey() {
    this._memoryAccessKey = "";
    this.removeStoredAccessKey();
    this.setState({
      accessKeyDraft: "",
      showAccessKeyInput: true,
    });
  }

  saveAccessKey(event) {
    event.preventDefault();
    const accessKey = this.state.accessKeyDraft.trim();
    if (!accessKey) return;
    this.storeAccessKey(accessKey);
    this.setState({
      accessKeyDraft: "",
      showAccessKeyInput: false,
    }, () => this.requestCorrections(accessKey));
  }

  launchCorrection() {
    const accessKey = this.getAccessKey();
    if (!accessKey) {
      this.setState({
        showAccessKeyInput: true,
        message: "Introduceți cheia de acces Codex pentru această sesiune.",
      });
      return;
    }
    this.requestCorrections(accessKey);
  }

  validateSuggestions(baseText, rawSuggestions) {
    if (!Array.isArray(rawSuggestions)) {
      throw new Error("Răspunsul Codex nu conține o listă validă de corectări.");
    }
    const baseLength = Array.from(baseText).length;
    let cursor = 0;
    return rawSuggestions.map((suggestion, index) => {
      const start = Number(suggestion.start);
      const end = Number(suggestion.end);
      const original = suggestion.original;
      const replacement = suggestion.replacement;
      if (
        !Number.isInteger(start)
        || !Number.isInteger(end)
        || start < cursor
        || end < start
        || end > baseLength
        || typeof original !== "string"
        || typeof replacement !== "string"
        || this.sliceText(baseText, start, end) !== original
      ) {
        throw new Error("Codex a întors poziții de corectare invalide.");
      }
      cursor = end;
      return {
        id: suggestion.id || `c${index + 1}`,
        type: suggestion.type || "replace",
        start,
        end,
        original,
        replacement,
        status: "pending",
      };
    });
  }

  composeText(baseText, suggestions) {
    if (!suggestions.length) return baseText;
    const baseCharacters = Array.from(baseText);
    let cursor = 0;
    let result = "";
    suggestions.forEach((suggestion) => {
      result += baseCharacters.slice(cursor, suggestion.start).join("");
      result += suggestion.status === "accepted"
        ? suggestion.replacement
        : baseCharacters.slice(suggestion.start, suggestion.end).join("");
      cursor = suggestion.end;
    });
    return result + baseCharacters.slice(cursor).join("");
  }

  sliceText(text, start, end) {
    return Array.from(text).slice(start, end).join("");
  }

  emitCurrentText() {
    if (this.props.onTextChange) {
      this.props.onTextChange(
        this.composeText(this.state.baseText, this.state.suggestions)
      );
    }
  }

  isOcrTask() {
    return this.props.task === "ocr";
  }

  canRun() {
    const targetText = this.props.targetText || "";
    if (!targetText.trim()) return false;
    if (this.isOcrTask()) return Boolean(this.props.imageRef);
    const sourceText = this.props.sourceText || "";
    return Boolean(sourceText.trim());
  }

  readyMessage(suggestions, reviewStatus) {
    if (suggestions.length) {
      if (this.isOcrTask() && reviewStatus === "partial") {
        return "Pagina s-a aliniat doar parțial; sunt afișate numai corectările locale considerate sigure.";
      }
      return "Clic pe varianta verde pentru a valida corectarea.";
    }
    if (!this.isOcrTask()) {
      return "Codex nu a identificat corectări neechivoce.";
    }
    if (reviewStatus === "insufficient_evidence") {
      return "Imaginea nu oferă dovezi suficiente pentru o corectare sigură.";
    }
    if (reviewStatus === "unalignable") {
      return "Imaginea și textul OCR nu au putut fi aliniate în siguranță.";
    }
    return "Codex nu a identificat erori OCR clare, susținute vizual.";
  }

  async requestCorrections(providedAccessKey) {
    const sourceText = this.props.sourceText || "";
    const targetText = this.props.targetText || "";
    if (!this.canRun()) return;
    const accessKey = providedAccessKey || this.getAccessKey();
    if (!accessKey) {
      this.setState({ showAccessKeyInput: true });
      return;
    }

    const requestId = ++this._requestId;
    this.setState({
      phase: "loading",
      baseText: targetText,
      suggestions: [],
      history: [],
      reviewStatus: "",
      fidelity: null,
      message: this.isOcrTask()
        ? "Codex compară textul OCR cu imaginea procesată..."
        : "Codex compară textul transliterat cu oglinda OCR...",
    });
    try {
      const requestBody = {
        task: this.props.task || "transliteration",
        sourceText,
        targetText,
        period: this.props.period || "",
        alphabet: this.props.alphabet || "",
      };
      if (this.isOcrTask()) {
        requestBody.imageRef = this.props.imageRef;
        requestBody.pageId = this.props.pageId;
        requestBody.errorThreshold = this.props.errorThreshold == null
          ? 0.98
          : this.props.errorThreshold;
        requestBody.minimumFidelity = this.props.minimumFidelity == null
          ? 0.90
          : this.props.minimumFidelity;
      }
      const data = await this.props.api.post(
        "codex-correct/",
        requestBody,
        { Authorization: `Bearer ${accessKey}` }
      );
      if (data && data.code === 401) {
        const accessError = new Error(data.msg || "Cheia Codex nu este validă.");
        accessError.invalidAccessKey = true;
        throw accessError;
      }
      if (!data || data.code !== 200) {
        throw new Error((data && data.msg) || "Verificarea Codex a eșuat.");
      }
      const suggestions = this.validateSuggestions(
        targetText,
        data.suggestions
      );
      if (!this._mounted || requestId !== this._requestId) return;
      this.setState({
        phase: "ready",
        baseText: targetText,
        suggestions,
        history: [],
        reviewStatus: data.reviewStatus || "",
        fidelity: typeof data.fidelity === "number" ? data.fidelity : null,
        message: this.readyMessage(suggestions, data.reviewStatus),
      });
    } catch (error) {
      if (!this._mounted || requestId !== this._requestId) return;
      if (error && error.invalidAccessKey) {
        this._memoryAccessKey = "";
        this.removeStoredAccessKey();
      }
      this.setState({
        phase: "error",
        showAccessKeyInput: Boolean(error && error.invalidAccessKey),
        message: error && error.message
          ? error.message
          : "Verificarea Codex a eșuat.",
      });
    }
  }

  applyStatus(ids, nextStatus) {
    this.setState((previous) => {
      const idSet = new Set(ids);
      const changes = [];
      const suggestions = previous.suggestions.map((suggestion) => {
        if (!idSet.has(suggestion.id) || suggestion.status === nextStatus) {
          return suggestion;
        }
        changes.push({ id: suggestion.id, status: suggestion.status });
        return { ...suggestion, status: nextStatus };
      });
      if (!changes.length) return null;
      return {
        suggestions,
        history: [...previous.history, changes],
      };
    }, () => this.emitCurrentText());
  }

  acceptSuggestion(id) {
    this.applyStatus([id], "accepted");
  }

  rejectSuggestion(id) {
    this.applyStatus([id], "rejected");
  }

  acceptAll() {
    const pending = this.state.suggestions
      .filter((item) => item.status === "pending")
      .map((item) => item.id);
    this.applyStatus(pending, "accepted");
  }

  rejectRemaining() {
    const pending = this.state.suggestions
      .filter((item) => item.status === "pending")
      .map((item) => item.id);
    this.applyStatus(pending, "rejected");
  }

  undoLast() {
    this.setState((previous) => {
      if (!previous.history.length) return null;
      const history = [...previous.history];
      const changes = history.pop();
      const previousStatuses = new Map(
        changes.map((change) => [change.id, change.status])
      );
      const suggestions = previous.suggestions.map((suggestion) => (
        previousStatuses.has(suggestion.id)
          ? { ...suggestion, status: previousStatuses.get(suggestion.id) }
          : suggestion
      ));
      return { suggestions, history };
    }, () => this.emitCurrentText());
  }

  renderChangeText(value, emptyLabel) {
    if (value === "") return emptyLabel;
    return value.replace(/ /g, "␠").replace(/\t/g, "⇥");
  }

  renderReviewedText() {
    const { baseText, suggestions } = this.state;
    if (!suggestions.length) {
      return <div className="codex-reviewed-text">{this.props.targetText}</div>;
    }

    const content = [];
    let cursor = 0;
    suggestions.forEach((suggestion, index) => {
      content.push(
        <React.Fragment key={`text-${suggestion.id}`}>
          {this.sliceText(baseText, cursor, suggestion.start)}
        </React.Fragment>
      );
      if (suggestion.status === "rejected") {
        content.push(
          <span className="codex-rejected-text" key={`change-${suggestion.id}`}>
            {suggestion.original}
          </span>
        );
      } else {
        content.push(
          <span
            className={`codex-inline-change codex-${suggestion.status}`}
            key={`change-${suggestion.id}`}
          >
            <del>{this.renderChangeText(suggestion.original, "∅")}</del>
            <button
              type="button"
              className="codex-inline-accept"
              disabled={suggestion.status === "accepted"}
              onClick={() => this.acceptSuggestion(suggestion.id)}
              title="Validează această corectare"
            >
              {this.renderChangeText(suggestion.replacement, "șterge")}
              {suggestion.status === "accepted" ? " ✓" : ""}
            </button>
          </span>
        );
      }
      cursor = suggestion.end;
    });
    content.push(
      <React.Fragment key="text-end">
        {this.sliceText(baseText, cursor, Array.from(baseText).length)}
      </React.Fragment>
    );
    return <div className="codex-reviewed-text">{content}</div>;
  }

  renderDebugPanel() {
    const { phase, suggestions, history, message, fidelity } = this.state;
    if (phase === "idle" || phase === "loading") return null;
    if (phase === "error") {
      return (
        <div className="codex-debug-panel codex-debug-error">
          <div className="codex-debug-title">CODEX REVIEW · EROARE</div>
          <div>{message}</div>
        </div>
      );
    }

    const pending = suggestions.filter((item) => item.status === "pending").length;
    const accepted = suggestions.filter((item) => item.status === "accepted").length;
    return (
      <div className="codex-debug-panel">
        <div className="codex-debug-toolbar">
          <span className="codex-debug-title">
            CODEX REVIEW · {accepted}/{suggestions.length} acceptate · {pending} în așteptare
          </span>
          <span className="codex-debug-actions">
            <button
              type="button"
              disabled={!pending}
              onClick={() => this.acceptAll()}
              title="Acceptă toate propunerile rămase"
            >✓ toate</button>
            <button
              type="button"
              disabled={!pending}
              onClick={() => this.rejectRemaining()}
              title="Respinge toate propunerile rămase"
            >× restul</button>
            <button
              type="button"
              disabled={!history.length}
              onClick={() => this.undoLast()}
              title="Anulează ultima decizie"
            >↶</button>
          </span>
        </div>
        <div className="codex-debug-message">{message}</div>
        {this.isOcrTask() && fidelity !== null && (
          <div className="codex-debug-message">
            Fidelitate vizuală estimată: {Math.round(fidelity * 100)}%
          </div>
        )}
        {suggestions.length > 0 && (
          <div className="codex-debug-list">
            {suggestions.map((suggestion, index) => (
              <div
                className={`codex-debug-row codex-row-${suggestion.status}`}
                key={`row-${suggestion.id}`}
              >
                <span className="codex-debug-index">{index + 1}</span>
                <del>{this.renderChangeText(suggestion.original, "∅")}</del>
                <span className="codex-debug-arrow">→</span>
                <button
                  type="button"
                  className="codex-debug-accept"
                  disabled={suggestion.status === "accepted"}
                  onClick={() => this.acceptSuggestion(suggestion.id)}
                >{this.renderChangeText(suggestion.replacement, "șterge")}</button>
                <button
                  type="button"
                  className="codex-debug-reject"
                  disabled={suggestion.status === "rejected"}
                  onClick={() => this.rejectSuggestion(suggestion.id)}
                  title="Respinge propunerea"
                >×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  renderAccessKeyPanel() {
    if (!this.state.showAccessKeyInput) return null;
    return (
      <form
        className="codex-access-panel"
        onSubmit={(event) => this.saveAccessKey(event)}
      >
        <span className="codex-access-label">ACCES CODEX</span>
        <input
          type="password"
          value={this.state.accessKeyDraft}
          onChange={(event) => this.setState({ accessKeyDraft: event.target.value })}
          placeholder="Cheia de acces"
          autoComplete="off"
          aria-label="Cheia de acces Codex"
        />
        <button
          type="submit"
          disabled={!this.state.accessKeyDraft.trim()}
        >Deblochează și verifică</button>
        <button
          type="button"
          onClick={() => this.setState({
            accessKeyDraft: "",
            showAccessKeyInput: false,
          })}
        >Renunță</button>
        <small>Cheia rămâne numai în sesiunea acestui tab.</small>
      </form>
    );
  }

  render() {
    const loading = this.state.phase === "loading";
    const hasAccessKey = Boolean(this.getAccessKey());
    const canRun = this.canRun();
    const isOcrTask = this.isOcrTask();
    return (
      <div className="codex-correction-review">
        <div className="codex-review-launcher">
          <Button
            type="button"
            variant="outline-success"
            size="sm"
            disabled={!canRun || loading}
            onClick={() => this.launchCorrection()}
          >
            {loading && <Spinner animation="border" size="sm" className="me-1" />}
            {loading
              ? "Codex verifică..."
              : isOcrTask
                ? "Verifică OCR cu ajutorul Codex (experimental)"
                : "Corectează cu ajutorul Codex (experimental)"}
          </Button>
          {!hasAccessKey && (
            <small>
              {isOcrTask
                ? "Disponibil pentru imagini după OCR · nicio modificare nu se aplică automat"
                : "Disponibil după transliterare · nicio modificare nu se aplică automat"}
            </small>
          )}
        </div>
        {this.renderAccessKeyPanel()}
        {this.renderDebugPanel()}
        {this.renderReviewedText()}
      </div>
    );
  }
}
