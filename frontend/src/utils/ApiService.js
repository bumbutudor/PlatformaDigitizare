import React from "react";
import FetchWrapper from "../components/FetchWrapper";

const API = new FetchWrapper('https://a1ef-81-180-76-251.eu.ngrok.io/');

export const getDictionary = async () => {
    const dictionaryEndpoint = 'exception-dictionary/';
    const data = API.post(dictionaryEndpoint, {});
    return data;

}
