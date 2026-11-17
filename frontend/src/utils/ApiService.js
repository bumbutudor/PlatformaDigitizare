import { createApiClient } from './ApiConfig';

const API = createApiClient();

export const getDictionary = async () => {
    const dictionaryEndpoint = 'exception-dictionary/';
    const data = API.post(dictionaryEndpoint, {});
    return data;
}
