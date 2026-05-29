/**
 * ServiceStatus - singleton monitor for backend service health.
 *
 * Polls the backend `/health/` endpoint on an interval and notifies
 * subscribers. Designed to work with the existing class-based step
 * components: a step subscribes in componentDidMount and unsubscribes in
 * componentWillUnmount, then calls `evaluate([...])` to decide whether the
 * services it needs are available.
 */

// Stable service identifiers - must match the keys returned by the backend
// health endpoint (see backend/apps/access/health.py).
export const SERVICES = {
  FINEREADER: "finereader",
  TRANSLITERA: "translitera",
  PUBLISH: "publish",
  S3: "s3",
  OPENAI: "openai",
  BACKEND: "backend", // synthetic - represents the Django server itself
};

// Fallback labels (the backend also sends a `label` per service).
const FALLBACK_LABELS = {
  finereader: "FineReader (OCR)",
  translitera: "Transliterare",
  publish: "Publicare",
  s3: "Stocare (S3)",
  openai: "OpenAI (opțional)",
  backend: "Server (backend)",
};

// Which services each pipeline step requires to function.
export const STEP_REQUIREMENTS = {
  upload: [SERVICES.S3],
  ocr: [SERVICES.FINEREADER],
  transliterate: [SERVICES.TRANSLITERA],
  publish: [SERVICES.PUBLISH],
};

class ServiceStatusMonitor {
  constructor() {
    this.baseUrl = null;
    this.intervalId = null;
    this.intervalMs = 20000;
    this.listeners = new Set();
    this.status = {
      overall: "unknown", // ok | degraded | unreachable | unknown
      reachable: null, // null = not yet checked, false = backend unreachable
      healthAvailable: false, // true only when /health/ returns valid JSON
      services: {},
      criticalOffline: [],
      checkedAt: null,
      lastError: null,
    };
  }

  configure(baseUrl) {
    // Normalize trailing slash.
    this.baseUrl = baseUrl ? baseUrl.replace(/\/?$/, "/") : baseUrl;
  }

  start(intervalMs) {
    if (intervalMs) this.intervalMs = intervalMs;
    this.refresh();
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => this.refresh(), this.intervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async refresh() {
    if (!this.baseUrl) return this.status;
    let response;
    try {
      response = await fetch(this.baseUrl + "health/", {
        method: "GET",
        headers: {
          // Skip ngrok's interstitial HTML page so we always get JSON.
          "ngrok-skip-browser-warning": "true",
          Accept: "application/json",
        },
      });
    } catch (err) {
      // A thrown fetch means a true network failure => backend unreachable.
      this.status = {
        overall: "unreachable",
        reachable: false,
        healthAvailable: false,
        services: {},
        criticalOffline: [SERVICES.BACKEND],
        checkedAt: Math.floor(Date.now() / 1000),
        lastError: err && err.message ? err.message : String(err),
      };
      this._notify();
      return this.status;
    }

    // We got an HTTP response, so the server itself is reachable. The backend
    // returns 503 (still JSON) when a critical service is down, so we parse the
    // body regardless of HTTP status.
    let data = null;
    try {
      data = await response.json();
    } catch (parseErr) {
      data = null;
    }

    if (data && (data.services || data.overall)) {
      // Valid health payload from the new backend.
      this.status = {
        overall: data.overall || "unknown",
        reachable: true,
        healthAvailable: true,
        services: data.services || {},
        criticalOffline: data.criticalOffline || [],
        checkedAt: data.checkedAt || Math.floor(Date.now() / 1000),
        lastError: null,
      };
    } else {
      // Server reachable but /health/ is missing (404) or returned non-JSON.
      // Treat diagnostics as unavailable WITHOUT blocking any step, so the
      // platform keeps working until the health endpoint is deployed.
      this.status = {
        overall: "unknown",
        reachable: true,
        healthAvailable: false,
        services: {},
        criticalOffline: [],
        checkedAt: Math.floor(Date.now() / 1000),
        lastError:
          response.status === 404
            ? "Endpoint /health/ indisponibil (backend neactualizat)"
            : "Răspuns /health/ invalid",
      };
    }
    this._notify();
    return this.status;
  }

  getStatus() {
    return this.status;
  }

  labelFor(name) {
    const svc = this.status.services[name];
    return (svc && svc.label) || FALLBACK_LABELS[name] || name;
  }

  isServiceOnline(name) {
    const svc = this.status.services[name];
    return !!svc && svc.status === "online";
  }

  /**
   * Evaluate whether the given services are available.
   * Returns { blocked, reachable, offline: [{ name, label }] }.
   */
  evaluate(requiredServices = []) {
    // Backend unreachable blocks every step.
    if (this.status.reachable === false) {
      return {
        blocked: true,
        reachable: false,
        offline: [{ name: SERVICES.BACKEND, label: FALLBACK_LABELS.backend }],
      };
    }

    // Not yet checked - don't block (avoid false negatives on first paint).
    if (this.status.reachable === null) {
      return { blocked: false, reachable: null, offline: [] };
    }

    // Server reachable but health diagnostics unavailable (endpoint missing /
    // not deployed). Don't block - degrade gracefully and keep working.
    if (!this.status.healthAvailable) {
      return { blocked: false, reachable: true, offline: [] };
    }

    const offline = [];
    for (const name of requiredServices) {
      if (!this.isServiceOnline(name)) {
        offline.push({ name, label: this.labelFor(name) });
      }
    }
    return { blocked: offline.length > 0, reachable: true, offline };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    // Fire immediately with current status so the subscriber renders correctly.
    try {
      listener(this.status);
    } catch (e) {
      // ignore listener errors
    }
    return () => this.listeners.delete(listener);
  }

  _notify() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.status);
      } catch (e) {
        // ignore listener errors
      }
    });
  }
}

// Export a single shared instance.
const monitor = new ServiceStatusMonitor();
export default monitor;
