import assert from 'assert';
import {
  buildOcrRequest,
  ocrFailureMessage,
  usesTesseract,
} from '../src/utils/OcrModels';

describe('OCR engine selection', () => {
  it('uses Tesseract only for the 19th century Tesseract model', () => {
    assert.strictEqual(
      usesTesseract({ period: 'secolulXIX', ocrModel: 'secolulXIX_4' }),
      true,
    );
    assert.strictEqual(
      usesTesseract({ period: 'secolulXIX', ocrModel: 'secolulXIX_2' }),
      false,
    );
  });

  it('does not keep Tesseract on after the period changes', () => {
    // The model radio of the previous period stays selected in the store.
    assert.strictEqual(
      usesTesseract({ period: 'secolulXVIII', ocrModel: 'secolulXIX_4' }),
      false,
    );
    assert.strictEqual(usesTesseract(), false);
  });

  it('overrides a stale stored flag when building the request', () => {
    const state = {
      period: 'secolulXX',
      ocrModel: 'cyrillic',
      ocrOptions: { useTesseract: true },
      sourceFiles: [{ name: '5.jpg' }],
    };
    const request = buildOcrRequest(state, 'https://example.test/');

    assert.deepStrictEqual(request.ocrOptions, { useTesseract: false });
    assert.strictEqual(request.api, 'https://example.test/');
    assert.deepStrictEqual(request.sourceFiles, [{ name: '5.jpg' }]);
    assert.deepStrictEqual(state.ocrOptions, { useTesseract: true });
  });

  it('selects Tesseract when step 3 is reopened with that model', () => {
    const request = buildOcrRequest(
      { period: 'secolulXIX', ocrModel: 'secolulXIX_4' },
      'https://example.test/',
    );
    assert.deepStrictEqual(request.ocrOptions, { useTesseract: true });
  });
});

describe('OCR failure message', () => {
  it('surfaces the backend message of a failed request', () => {
    assert.strictEqual(
      ocrFailureMessage({ code: 500, msg: 'FineReader nu a produs textul' }),
      'FineReader nu a produs textul',
    );
  });

  it('stays empty for a successful or malformed response', () => {
    assert.strictEqual(ocrFailureMessage({ code: 200, msg: 'success' }), '');
    assert.strictEqual(ocrFailureMessage({ code: 500 }), '');
    assert.strictEqual(ocrFailureMessage(null), '');
  });
});
