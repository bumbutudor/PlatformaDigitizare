import assert from 'assert';
import { handoffFromLocation, digiRequest, saveDigiSession, readDigiSession } from '../src/utils/DigiBridge';

describe('Digi handoff and confirmed saving', () => {
  let previous;
  beforeEach(() => {
    previous = { window: global.window, history: global.history, location: global.location,
      fetch: global.fetch, sessionStorage: global.sessionStorage };
    const values = {};
    global.sessionStorage = { getItem: key => values[key] || null, setItem: (key, value) => { values[key] = value; } };
    global.location = { pathname: '/', search: '', hash: '' };
    global.window = { location: global.location };
    global.history = { replaceState: (state, title, url) => { global.location.hash = ''; } };
  });
  afterEach(() => Object.keys(previous).forEach(key => { global[key] = previous[key]; }));

  it('consumes a valid capability from the fragment and clears browser history', () => {
    global.location.hash = '#digi=11111111-1111-4111-8111-111111111111&token=' + 'a'.repeat(64);
    const context = handoffFromLocation();
    assert.strictEqual(context.token, 'a'.repeat(64));
    assert.strictEqual(global.location.hash, '');
  });

  it('rejects malformed links instead of silently loading another document', () => {
    global.location.hash = '#digi=wrong&token=wrong';
    assert.throws(() => handoffFromLocation(), /invalidă/);
  });

  it('keeps imported documents and corrected text across a refresh in the same tab', () => {
    const store = { digiContext: { id: 'id', token: 'token' }, ocrResults: ['corectat'] };
    saveDigiSession(store);
    assert.deepStrictEqual(readDigiSession(), store);
  });

  it('never treats an HTTP failure as a successful save', async () => {
    global.fetch = async () => ({ ok: false, json: async () => ({ code: 503, msg: 'Reîncearcă.' }) });
    let failed = false;
    try { await digiRequest('https://api.test/', 'publish/', { token: 'test' }); }
    catch (error) { failed = true; assert.strictEqual(error.message, 'Reîncearcă.'); }
    assert.strictEqual(failed, true);
  });
});
