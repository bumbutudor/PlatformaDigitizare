'use strict';

import React, { Component } from 'react';
import { toMediaProxyUrl } from '../utils/DocumentSource';

export default class OriginalDocumentPreview extends Component {
  constructor(props) {
    super(props);
    this.state = { candidateIndex: 0 };
  }

  componentDidUpdate(prevProps) {
    const previousUrls = (prevProps.candidates || []).map(item => item.url).join('|');
    const currentUrls = (this.props.candidates || []).map(item => item.url).join('|');
    if (previousUrls !== currentUrls && this.state.candidateIndex !== 0) {
      this.setState({ candidateIndex: 0 });
    }
  }

  handleMediaError = () => {
    this.setState(previous => ({
      candidateIndex: previous.candidateIndex + 1,
    }));
  };

  render() {
    const candidates = this.props.candidates || [];
    const candidate = candidates[this.state.candidateIndex];

    return (
      <aside className="step5-original-preview" aria-label="Documentul original">
        <div className="step5-original-title">Original</div>
        {!candidate && (
          <div className="step5-original-empty">
            Originalul nu este disponibil pentru această pagină.
          </div>
        )}
        {candidate && candidate.kind === 'pdf' && (
          <>
            <iframe
              className="step5-original-pdf"
              src={toMediaProxyUrl(candidate.url, this.props.apiBase)}
              title={`Original PDF ${this.props.documentIndex + 1}`}
            />
            <a
              className="step5-original-open"
              href={candidate.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Deschide PDF-ul original
            </a>
          </>
        )}
        {candidate && candidate.kind === 'image' && (
          <>
            <button
              type="button"
              className="step5-original-image-button"
              onClick={() => this.props.onOpenImage(candidate.url)}
              title="Mărește imaginea originală"
            >
              <img
                src={candidate.url}
                alt={`Document original ${this.props.documentIndex + 1}`}
                onError={this.handleMediaError}
              />
            </button>
            <button
              type="button"
              className="step5-original-open"
              onClick={() => this.props.onOpenImage(candidate.url)}
            >
              Mărește originalul
            </button>
          </>
        )}
        {candidate && (
          <small className="step5-original-source">{candidate.label}</small>
        )}
      </aside>
    );
  }
}
