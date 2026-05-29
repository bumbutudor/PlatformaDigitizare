"use strict";

import React, { Component } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import Spinner from "react-bootstrap/Spinner";
import ServiceStatus from "../utils/ServiceStatus";

/**
 * Diagnostic panel (modal) listing the live status of every backend service:
 * online/offline indicator, latency, message, and whether it is critical.
 * Includes a manual refresh button and the last-checked time.
 */
export default class ServiceDiagnosticsPanel extends Component {
  constructor(props) {
    super(props);
    this.state = { status: ServiceStatus.getStatus(), refreshing: false };
  }

  componentDidMount() {
    this._unsubscribe = ServiceStatus.subscribe((status) =>
      this.setState({ status })
    );
  }

  componentWillUnmount() {
    if (this._unsubscribe) this._unsubscribe();
  }

  async handleRefresh() {
    this.setState({ refreshing: true });
    await ServiceStatus.refresh();
    this.setState({ refreshing: false });
  }

  renderRow(name, svc) {
    const online = svc.status === "online";
    const variant = online ? "success" : svc.critical ? "danger" : "secondary";
    const label = svc.label || name;
    return (
      <tr key={name}>
        <td>
          {label}
          {svc.critical ? (
            <Badge bg="light" text="dark" className="ms-2">
              critic
            </Badge>
          ) : (
            <Badge bg="light" text="muted" className="ms-2">
              opțional
            </Badge>
          )}
        </td>
        <td>
          <Badge bg={variant}>{online ? "online" : "offline"}</Badge>
        </td>
        <td>{svc.latency_ms != null ? svc.latency_ms + " ms" : "—"}</td>
        <td style={{ fontSize: "0.85em" }}>{svc.message || ""}</td>
      </tr>
    );
  }

  render() {
    const { show, onHide } = this.props;
    const { status, refreshing } = this.state;
    const services = status.services || {};
    const checkedAt = status.checkedAt
      ? new Date(status.checkedAt * 1000).toLocaleTimeString()
      : "—";

    let banner = null;
    if (status.reachable === false) {
      banner = (
        <div className="alert alert-danger">
          Serverul platformei este indisponibil.
          {status.lastError ? " (" + status.lastError + ")" : ""}
        </div>
      );
    } else if (status.reachable === true && status.healthAvailable === false) {
      banner = (
        <div className="alert alert-secondary">
          Serverul răspunde, dar diagnosticul serviciilor nu este disponibil.
          {status.lastError ? " (" + status.lastError + ")" : ""} Platforma
          rămâne funcțională.
        </div>
      );
    } else if (status.overall === "degraded") {
      banner = (
        <div className="alert alert-warning">
          Cel puțin un serviciu critic este offline. Etapele care depind de el
          sunt dezactivate.
        </div>
      );
    } else if (status.overall === "ok") {
      banner = (
        <div className="alert alert-success">
          Toate serviciile critice sunt online.
        </div>
      );
    }

    return (
      <Modal show={show} onHide={onHide} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Diagnostic servicii</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {banner}
          <table className="table table-sm align-middle">
            <thead>
              <tr>
                <th>Serviciu</th>
                <th>Stare</th>
                <th>Latență</th>
                <th>Detalii</th>
              </tr>
            </thead>
            <tbody>
              {status.reachable === false ? (
                <tr>
                  <td colSpan="4" className="text-muted">
                    Niciun serviciu nu poate fi verificat cât timp serverul este
                    offline.
                  </td>
                </tr>
              ) : Object.keys(services).length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-muted">
                    {status.healthAvailable === false
                      ? "Diagnosticul serviciilor nu este disponibil pe acest server."
                      : "Se verifică serviciile..."}
                  </td>
                </tr>
              ) : (
                Object.keys(services).map((name) =>
                  this.renderRow(name, services[name])
                )
              )}
            </tbody>
          </table>
          <small className="text-muted">
            Ultima verificare: {checkedAt}
          </small>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-primary"
            onClick={() => this.handleRefresh()}
            disabled={refreshing}
          >
            {refreshing ? (
              <>
                <Spinner animation="border" size="sm" /> Se verifică...
              </>
            ) : (
              "Reîmprospătează"
            )}
          </Button>
          <Button variant="secondary" onClick={onHide}>
            Închide
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}
