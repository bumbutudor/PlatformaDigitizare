import React from "react";
import FetchWrapper from "../components/FetchWrapper";

const API = new FetchWrapper('https://uuj2kn6s.ngrok.app/');

export const getDictionary = async () => {
    const dictionaryEndpoint = 'exception-dictionary/';
    const data = API.post(dictionaryEndpoint, {});
    return data;
}
