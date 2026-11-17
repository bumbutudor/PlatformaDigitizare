'use strict';

import React, { Component } from 'react';
import { createPortal } from 'react-dom';
import Draggable from 'react-draggable';

export default class FloatingOriginalDocumentWidget extends Component {
  constructor(props) {
    super(props);
    this.nodeRef = React.createRef();
  }

  render() {
    if (typeof document === 'undefined' || !document.body) return null;

    return createPortal(
      <div className="step5-floating-widget-layer">
        <Draggable
          nodeRef={this.nodeRef}
          handle=".step5-floating-widget-handle"
          bounds="parent"
        >
          <section
            ref={this.nodeRef}
            className="step5-floating-original-widget"
            aria-label="Imaginea originală pentru verificare"
          >
            <div className="step5-floating-widget-handle">
              <span>Imaginea originală</span>
              <span className="step5-floating-widget-drag-hint">
                trage pentru mutare&nbsp;⠿
              </span>
            </div>
            <div className="step5-floating-widget-content">
              {this.props.children}
            </div>
          </section>
        </Draggable>
      </div>,
      document.body,
    );
  }
}
