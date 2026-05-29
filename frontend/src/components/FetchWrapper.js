export default class FetchWrapper {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    get(endpoint) {
        return fetch(this.baseURL + endpoint, {
            headers: {
                "ngrok-skip-browser-warning": "true"
            }
        })
            .then(response => response.json());
    }

    post(endpoint, body) {
        // pass the endpoint and body parameters to _send
        // and specify the method to be 'post' request
        return this._send("post", endpoint, body);
    }

    put(endpoint, body) {
        return this._send("put", endpoint, body);
    }

    delete(endpoint, body) {
        return this._send("delete", endpoint, body);
    }

    _send(method, endpoint, body) {
        return fetch(this.baseURL + endpoint, {
            method,
            headers: {
                // send a header with every post, put, delete request
                "Content-Type": "application/json",
                // skip ngrok's interstitial HTML page so responses are JSON
                "ngrok-skip-browser-warning": "true"
            },
            body: JSON.stringify(body)
        }).then(response => response.json());
    }
}