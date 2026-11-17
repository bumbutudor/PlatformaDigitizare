import { expect } from 'chai';
import FetchWrapper from '../src/components/FetchWrapper';
import {
  apiUrl,
  getApiBaseUrl,
  normalizeApiBaseUrl,
} from '../src/utils/ApiConfig';

describe('runtime API configuration', () => {
  const previousWindow = global.window;

  afterEach(() => {
    if (typeof previousWindow === 'undefined') {
      delete global.window;
    } else {
      global.window = previousWindow;
    }
  });

  it('uses a same-origin fallback outside the browser', () => {
    delete global.window;
    expect(getApiBaseUrl()).to.equal('/api/');
  });

  it('uses and normalizes the runtime override', () => {
    global.window = {
      __DIGIAPP_CONFIG__: { backendBaseUrl: 'https://backend.example///' },
    };

    expect(getApiBaseUrl()).to.equal('https://backend.example/');
    expect(apiUrl('/health/')).to.equal('https://backend.example/health/');
  });

  it('normalizes relative bases and media paths', () => {
    expect(normalizeApiBaseUrl('/backend')).to.equal('/backend/');
    expect(apiUrl('media/page.jpg', '/backend')).to.equal('/backend/media/page.jpg');
  });
});

describe('dictionary deletion', () => {
  it('accepts the empty 204 response returned by the backend', async () => {
    const previousFetch = global.fetch;
    global.fetch = async () => ({
      status: 204,
      json: () => { throw new Error('A 204 response has no JSON body'); },
    });
    try {
      const api = new FetchWrapper('/api/');
      expect(await api.delete('exception-dictionary/1/')).to.equal(null);
    } finally {
      global.fetch = previousFetch;
    }
  });
});
