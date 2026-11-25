import assert from 'assert';
import Step3 from '../src/digitizare/Step3';
import { hasOcrText } from '../src/utils/OcrText';

describe('Empty OCR results', () => {
  const setup = (names = ['Pisania.jpg']) => {
    let store = {
      api: 'https://api.example/', period: 'secolulXVII', alphabet: 'cyrillicRomanian',
      sourceFiles: names.map(name => ({ name })),
      s3SourceFiles: names.map(name => ({ name, searchablePdfUrl: 'old.pdf' })),
      preprocessedFiles: names.map(name => `pre/OpenCV/${name}`),
      s3PreprocessedFiles: names.map(name => `https://api.example/media/pre/OpenCV/${name}`),
      ocrResults: ['old text'], ocrReviewRefs: ['old-ref'], searchablePdfs: ['old.pdf'],
      transResults: ['old transliteration'], savedToCloud: true, preprocessWith: 'OpenCV',
    };
    const step = new Step3({
      getStore: () => store,
      updateStore: update => { store = { ...store, ...update }; },
    });
    step.setState = update => { step.state = { ...step.state, ...update }; };
    step.state.showNextStep = true;
    return { step, getStore: () => store };
  };

  it('does not treat BOM, whitespace or unknown markers as recognized text', () => {
    ['', '\ufeff', '\t\r\n\f', '^^ ^', '\ufeff\u200b\u200c\u200d\u2060', null].forEach(text => {
      assert.strictEqual(hasOcrText(text), false);
    });
    ['ЇС', 'ꙋ', '123', '!', '\ufeffтекст\n'].forEach(text => {
      assert.strictEqual(hasOcrText(text), true);
    });
  });

  it('rejects empty text even if an older backend reports success', async () => {
    for (const text of ['', '\ufeff', ' \n\t', '^^', '\u200b', null]) {
      const { step, getStore } = setup();
      step.API.post = async () => ({ code: 200, ocrResults: [text], searchablePdfs: ['blank.pdf'] });
      await step.handleOCRRequest();
      assert.strictEqual(step.state.showNextStep, false);
      assert.strictEqual(step.state.showError, true);
      assert.strictEqual(step.state.show, true);
      assert.strictEqual(step.state.showLoader, false);
      assert.ok(step.state.errorMessage.includes('nu a recunoscut niciun text'));
      assert.ok(step.state.errorMessage.includes('Pisania.jpg'));
      assert.deepStrictEqual(step.state.ocrResults, []);
      assert.deepStrictEqual(getStore().ocrReviewRefs, []);
      assert.deepStrictEqual(getStore().searchablePdfs, []);
      assert.deepStrictEqual(getStore().transResults, []);
      assert.strictEqual(getStore().s3SourceFiles[0].searchablePdfUrl, undefined);
    }
  });

  it('names only the empty file when other images have recognized text', async () => {
    const { step } = setup(['good.jpg', 'blank.jpg']);
    step.API.post = async () => ({ code: 200, ocrResults: ['text', '\ufeff'] });
    await step.handleOCRRequest();
    assert.strictEqual(step.state.showNextStep, false);
    assert.ok(step.state.errorMessage.includes('blank.jpg'));
    assert.ok(!step.state.errorMessage.includes('good.jpg'));
  });

  it('shows the explicit backend failure and allows retrying another model', async () => {
    const { step, getStore } = setup();
    const message = 'Modelul OCR nu a recunoscut niciun text în fișierul „Pisania.jpg”.';
    step.API.post = async () => ({ code: 422, error: 'ocr_no_text', msg: message });
    await step.handleOCRRequest();
    assert.strictEqual(step.state.errorMessage, message);
    assert.strictEqual(step.state.showNextStep, false);
    assert.strictEqual(step.state.show, true);
    assert.deepStrictEqual(getStore().ocrResults, []);

    step.API.post = async () => ({ code: 200, ocrResults: ['\ufeffЇС\n123'], ocrReviewRefs: ['new-ref'] });
    await step.handleOCRRequest();
    assert.deepStrictEqual(getStore().ocrResults, ['ЇС\n123']);
    assert.deepStrictEqual(getStore().ocrReviewRefs, ['new-ref']);
    assert.strictEqual(step.state.showError, false);
    assert.strictEqual(step.state.showNextStep, true);
  });

  it('does not retain a prior successful result after a network failure', async () => {
    const { step, getStore } = setup();
    step.API.post = async () => { throw new Error('Conexiune întreruptă'); };
    await step.handleOCRRequest();
    assert.strictEqual(step.state.showNextStep, false);
    assert.strictEqual(step.state.show, true);
    assert.deepStrictEqual(getStore().ocrResults, []);
    assert.deepStrictEqual(getStore().searchablePdfs, []);
  });

  it('loads cached results before revealing them and allows fresh recognition', async function () {
    this.timeout(7000);
    const { step } = setup();
    let submitted;
    step.API.post = async (url, body) => {
      submitted = body;
      return { code: 200, ocrResults: ['text'], cachedFiles: body.forceOcr ? 0 : 1 };
    };
    const pending = step.handleOCRRequest();
    await new Promise(resolve => setImmediate(resolve));
    assert.strictEqual(step.state.showLoader, true);
    assert.strictEqual(step.state.jobStatus, 'loading');
    assert.strictEqual(step.state.showNextStep, false);
    assert.deepStrictEqual(step.state.ocrResults, []);
    await pending;
    assert.strictEqual(step.state.showLoader, false);
    assert.strictEqual(step.state.showNextStep, true);
    assert.strictEqual(step.state.cachedFiles, 1);
    step.setState({ forceOcr: true });
    await step.handleOCRRequest();
    assert.strictEqual(submitted.forceOcr, true);
    assert.strictEqual(step.state.cachedFiles, 0);
  });
});
