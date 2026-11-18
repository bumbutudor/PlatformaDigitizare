import assert from 'assert';
import Step3 from '../src/digitizare/Step3';

describe('Gemini OCR fallback consent', () => {
  const setup = () => {
    let store = { api: 'https://api.example/', period: 'secolulXX', alphabet: 'cyrillic',
      sourceFiles: [{ name: 'page.png' }], s3SourceFiles: [{ name: 'page.png' }],
      preprocessedFiles: ['pre/OpenCV/secolulXX/page.png'], s3PreprocessedFiles: [],
      ocrResults: [], ocrReviewRefs: [], preprocessWith: 'OpenCV' };
    const step = new Step3({ getStore: () => store, updateStore: update => { store = { ...store, ...update }; } });
    step.setState = update => { step.state = { ...step.state, ...update }; };
    return { step, store: () => store };
  };

  it('offers Gemini after failure, sends nothing until accepted, then keeps the result', async () => {
    const { step, store } = setup();
    const calls = [];
    step.API.post = async (url, body, headers) => {
      calls.push({ url, body, headers });
      if (url === 'ocr/') return { id: 'failed', token: 'capability', status: 'error', code: 422,
        elapsedSeconds: 0, msg: 'No text', geminiFallback: { available: true } };
      return { id: 'fallback', token: 'capability', status: 'done', code: 200, elapsedSeconds: 0,
        ocrEngine: 'gemini', ocrResults: ['Текст'], searchablePdfs: [null] };
    };
    await step.handleOCRRequest();
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(step.state.geminiOffer.id, 'failed');
    assert.strictEqual(step.state.errorMessage, 'No text');
    await step.handleOCRRequest(null, true);
    assert.strictEqual(calls[1].url, 'ocr/jobs/failed/gemini/');
    assert.deepStrictEqual(calls[1].body, { consent: true });
    assert.strictEqual(calls[1].headers.Authorization, 'Bearer capability');
    assert.deepStrictEqual(store().ocrResults, ['Текст']);
    assert.strictEqual(step.state.ocrEngine, 'gemini');
    assert.strictEqual(step.state.showNextStep, true);
  });

  it('does not offer an unavailable fallback or submit it without a failed job', async () => {
    const { step } = setup();
    let calls = 0;
    step.API.post = async () => { calls += 1; return { code: 503, msg: 'Offline' }; };
    await step.handleOCRRequest(null, true);
    assert.strictEqual(calls, 0);
    await step.handleOCRRequest();
    assert.strictEqual(step.state.geminiOffer, null);
  });
});
