// The only OCR model that runs through Tesseract instead of the FineReader
// Hot Folder. It belongs to the 19th century model list in step 3.
export const TESSERACT_OCR_MODEL = 'secolulXIX_4';

// Derived from the current selection on every request. A stored flag used to
// stay on after another model or period was picked (sending everything to
// Tesseract) and was lost when step 3 was reopened (sending the Tesseract
// model to FineReader).
export const usesTesseract = ({ period, ocrModel } = {}) => (
  period === 'secolulXIX' && ocrModel === TESSERACT_OCR_MODEL
);

export const buildOcrRequest = (state, api) => ({
  ...state,
  ocrOptions: { useTesseract: usesTesseract(state || {}) },
  api,
});

// The backend answers failures with { code, msg }; surface that message so
// the user sees why OCR failed instead of a generic "try again".
export const ocrFailureMessage = (data) => (
  data && data.code !== 200 && typeof data.msg === 'string' ? data.msg : ''
);
