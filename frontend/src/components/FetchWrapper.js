export default class FetchWrapper {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    get(endpoint) {
        return fetch(this.baseURL + endpoint)
            .then(response => response.json());
    }

    post(endpoint, body, extraHeaders = {}) {
        // pass the endpoint and body parameters to _send
        // and specify the method to be 'post' request
        return this._send("post", endpoint, body, extraHeaders);
    }

    put(endpoint, body) {
        return this._send("put", endpoint, body);
    }

    delete(endpoint, body) {
        return this._send("delete", endpoint, body);
    }

    _send(method, endpoint, body, extraHeaders = {}) {
        return fetch(this.baseURL + endpoint, {
            method,
            headers: {
                // send a header with every post, put, delete request
                "Content-Type": "application/json",
                ...extraHeaders
            },
            body: JSON.stringify(body)
        }).then(response => response.status === 204 ? null : response.json());
    }
}
