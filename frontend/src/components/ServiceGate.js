"use strict";

import React, { Component } from "react";
import Alert from "react-bootstrap/Alert";
import ServiceStatus from "../utils/ServiceStatus";

/**
 * Subscribes to the service monitor and renders a warning Alert when any of the
 * `requiredServices` is offline. Also reports the blocked state to the parent
 * via `onBlockChange` so the step can disable its action button.
 *
 * Usage in a step:
 *   <ServiceGate
 *     requiredServices={[SERVICES.FINEREADER]}
 *     onBlockChange={(block) => this.setState({ serviceBlock: block })}
 *   />
 */
export default class ServiceGate extends Component {
  constructor(props) {
    super(props);
    this.state = { block: { blocked: false, reachable: null, offline: [] } };
  }

  componentDidMount() {
    this._unsubscribe = ServiceStatus.subscribe(() => this._update());
  }

  componentWillUnmount() {
    if (this._unsubscribe) this._unsubscribe();
  }

  _update() {
    const block = ServiceStatus.evaluate(this.props.requiredServices || []);
    this.setState({ block });
    if (this.props.onBlockChange) this.props.onBlockChange(block);
  }

  render() {
    const { block } = this.state;
    if (!block.blocked) return null;

    if (block.reachable === false) {
      return (
        <Alert variant="danger" className="mt-2">
          <Alert.Heading>Serverul este indisponibil</Alert.Heading>
          <p className="mb-0">
            Nu se poate contacta serverul platformei. Verificați conexiunea sau
            reveniți mai târziu. Această etapă este temporar dezactivată.
          </p>
        </Alert>
      );
    }

    const names = block.offline.map((s) => s.label).join(", ");
    return (
      <Alert variant="warning" className="mt-2">
        <Alert.Heading>Serviciu indisponibil</Alert.Heading>
        <p className="mb-0">
          Această etapă necesită un serviciu care momentan este offline:{" "}
          <strong>{names}</strong>. Acțiunea este dezactivată până când serviciul
          revine online.
        </p>
      </Alert>
    );
  }
}
