import FetchWrapper from '../components/FetchWrapper';

const DEFAULT_API_BASE_URL = '/api/';

export const normalizeApiBaseUrl = (value) => {
  const baseUrl = typeof value === 'string' && value.trim()
    ? value.trim()
    : DEFAULT_API_BASE_URL;

  return `${baseUrl.replace(/\/+$/, '')}/`;
};

export const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const config = window.__DIGIAPP_CONFIG__;
    if (config && typeof config.backendBaseUrl === 'string') {
      return normalizeApiBaseUrl(config.backendBaseUrl);
    }
  }

  return DEFAULT_API_BASE_URL;
};

export const apiUrl = (path = '', baseUrl = getApiBaseUrl()) => (
  normalizeApiBaseUrl(baseUrl) + String(path).replace(/^\/+/, '')
);

export const createApiClient = () => new FetchWrapper(getApiBaseUrl());
