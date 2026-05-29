"use strict";

import React, { Component } from "react";
import Badge from "react-bootstrap/Badge";
import ServiceStatus from "../utils/ServiceStatus";
import ServiceDiagnosticsPanel from "./ServiceDiagnosticsPanel";

/**
 * Compact, clickable status indicator for the wizard header. Shows the overall
 * health (green/amber/red) and opens the full diagnostic panel on click.
 */
export default class ServiceStatusBadge extends Component {
  constructor(props) {
    super(props);
    this.state = { status: ServiceStatus.getStatus(), showPanel: false };
  }

  componentDidMount() {
    this._unsubscribe = ServiceStatus.subscribe((status) =>
      this.setState({ status })
    );
  }

  componentWillUnmount() {
    if (this._unsubscribe) this._unsubscribe();
  }

  render() {
    const { status, showPanel } = this.state;

    let variant = "secondary";
    let text = "Servicii: se verifică...";

    if (status.reachable === false) {
      variant = "danger";
      text = "Server offline";
    } else if (status.reachable === true && status.healthAvailable === false) {
      variant = "secondary";
      text = "Diagnostic indisponibil";
    } else if (status.overall === "degraded") {
      variant = "warning";
      const count = (status.criticalOffline || []).length;
      text = `${count} serviciu(i) offline`;
    } else if (status.overall === "ok") {
      variant = "success";
      text = "Toate serviciile online";
    }

    return (
      <>
        <Badge
          bg={variant}
          style={{ cursor: "pointer" }}
          onClick={() => this.setState({ showPanel: true })}
          title="Deschide diagnosticul serviciilor"
        >
          ● {text}
        </Badge>
        <ServiceDiagnosticsPanel
          show={showPanel}
          onHide={() => this.setState({ showPanel: false })}
        />
      </>
    );
  }
}
