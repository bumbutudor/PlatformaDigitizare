import { expect } from 'chai';
import { renderToStaticMarkup } from 'react-dom/server';
import CodexCorrectionReview from '../src/components/CodexCorrectionReview';
import FetchWrapper from '../src/components/FetchWrapper';
import Step3 from '../src/digitizare/Step3';


describe('CodexCorrectionReview', () => {
  const createReview = targetText => new CodexCorrectionReview({
    targetText,
    sourceText: 'sursă',
  });

  const makeSetStateSynchronous = review => {
    review.setState = (update, callback) => {
      const next = typeof update === 'function'
        ? update(review.state, review.props)
        : update;
      if (next) review.state = { ...review.state, ...next };
      if (callback) callback();
    };
  };

  it('rebuilds text only from accepted suggestions', () => {
    const review = createReview('amează vechiu');
    const suggestions = [
      {
        id: 'c1', start: 2, end: 3, original: 'e', replacement: 'i', status: 'accepted',
      },
      {
        id: 'c2', start: 11, end: 12, original: 'u', replacement: '', status: 'pending',
      },
    ];

    expect(review.composeText('amează vechiu', suggestions)).to.equal('amiază vechiu');
  });

  it('accepts validated Unicode insertions and replacements', () => {
    const review = createReview('amează');
    const suggestions = review.validateSuggestions('amează', [
      {
        id: 'c1', type: 'replace', start: 2, end: 3, original: 'e', replacement: 'i',
      },
      {
        id: 'c2', type: 'insert', start: 6, end: 6, original: '', replacement: '!',
      },
    ]);

    expect(suggestions).to.have.length(2);
    expect(suggestions.every(item => item.status === 'pending')).to.equal(true);
  });

  it('uses Unicode code-point offsets when astral characters precede a fix', () => {
    const review = createReview('🙂amează');
    const suggestions = review.validateSuggestions('🙂amează', [{
      id: 'c1', type: 'replace', start: 3, end: 4, original: 'e', replacement: 'i',
    }]);
    suggestions[0].status = 'accepted';

    expect(review.composeText('🙂amează', suggestions)).to.equal('🙂amiază');
  });

  it('rejects suggestions whose original slice does not match the base text', () => {
    const review = createReview('text');

    expect(() => review.validateSuggestions('text', [{
      id: 'c1', start: 0, end: 1, original: 'X', replacement: 'T',
    }])).to.throw('poziții de corectare invalide');
  });

  it('sends the access key only in the Codex request header', async () => {
    let capturedHeaders = null;
    const review = new CodexCorrectionReview({
      targetText: 'amează',
      sourceText: 'амязэ',
      period: 'secolulXVII',
      alphabet: 'cyrillicRomanian',
      api: {
        post: async (endpoint, body, headers) => {
          capturedHeaders = headers;
          expect(body.period).to.equal('secolulXVII');
          expect(body.alphabet).to.equal('cyrillicRomanian');
          return { code: 200, suggestions: [] };
        },
      },
    });
    makeSetStateSynchronous(review);
    review._mounted = true;

    await review.requestCorrections('session-secret');

    expect(capturedHeaders).to.deep.equal({ Authorization: 'Bearer session-secret' });
    expect(JSON.stringify(review.state)).not.to.contain('session-secret');
  });

  it('sends the processed-image reference for an OCR review', async () => {
    let capturedBody = null;
    const review = new CodexCorrectionReview({
      task: 'ocr',
      targetText: '^ЇС хс',
      imageRef: 'signed-image-reference',
      pageId: '7',
      errorThreshold: 0.97,
      minimumFidelity: 0.91,
      period: 'secolulXVII',
      alphabet: 'cyrillicRomanian',
      api: {
        post: async (endpoint, body) => {
          capturedBody = body;
          return {
            code: 200,
            reviewStatus: 'corrected',
            fidelity: 0.99,
            suggestions: [],
          };
        },
      },
    });
    makeSetStateSynchronous(review);
    review._mounted = true;

    await review.requestCorrections('session-secret');

    expect(capturedBody).to.include({
      task: 'ocr',
      targetText: '^ЇС хс',
      imageRef: 'signed-image-reference',
      pageId: '7',
      errorThreshold: 0.97,
      minimumFidelity: 0.91,
    });
    expect(review.state.reviewStatus).to.equal('corrected');
    expect(review.state.fidelity).to.equal(0.99);
  });

  it('requires an image reference only for OCR review', () => {
    const withoutImage = new CodexCorrectionReview({
      task: 'ocr',
      targetText: 'text OCR',
      imageRef: '',
    });
    const withImage = new CodexCorrectionReview({
      task: 'ocr',
      targetText: 'text OCR',
      imageRef: 'signed-image-reference',
    });
    const transliteration = new CodexCorrectionReview({
      targetText: 'text latin',
      sourceText: 'текст',
    });

    expect(withoutImage.canRun()).to.equal(false);
    expect(withImage.canRun()).to.equal(true);
    expect(transliteration.canRun()).to.equal(true);
  });

  it('hides launcher helper and access status after the key is set', () => {
    const review = new CodexCorrectionReview({
      task: 'ocr',
      targetText: 'text OCR',
      imageRef: 'signed-image-reference',
    });
    review._memoryAccessKey = 'session-secret';

    const markup = renderToStaticMarkup(review.render());

    expect(markup).not.to.contain('Disponibil pentru imagini');
    expect(markup).not.to.contain('acces activ');
    expect(markup).not.to.contain('session-secret');
  });

  it('explains a partial visual alignment without reporting an error', () => {
    const review = new CodexCorrectionReview({
      task: 'ocr',
      targetText: 'text OCR',
      imageRef: 'signed-image-reference',
    });

    expect(review.readyMessage([{}], 'partial')).to.contain('doar parțial');
  });

  it('merges optional headers without changing FetchWrapper defaults', async () => {
    const originalFetch = global.fetch;
    let options = null;
    global.fetch = async (url, requestOptions) => {
      options = requestOptions;
      return { json: async () => ({ code: 200 }) };
    };
    try {
      const api = new FetchWrapper('https://example.test/');
      await api.post('codex-correct/', {}, { Authorization: 'Bearer secret' });
      expect(options.headers.Authorization).to.equal('Bearer secret');
      expect(options.headers['Content-Type']).to.equal('application/json');
    } finally {
      global.fetch = originalFetch;
    }
  });
});


describe('Step3 OCR review integration', () => {
  const createStep = (storeUpdate) => new Step3({
    getStore: () => ({
      api: 'https://example.test/',
      email: '',
      period: 'secolulXVII',
      typography: '',
      preprocessedFiles: [],
      s3PreprocessedFiles: [
        'https://example.test/processed-page-1.png',
        'https://example.test/processed-page-2.png',
      ],
      alphabet: 'cyrillicRomanian',
      sourceFiles: [],
      s3SourceFiles: [{ isPdf: true }, { isPdf: false }],
      ocrModel: '',
      ocrResults: ['prima pagină', 'a doua pagină'],
      ocrReviewRefs: ['signed-page-1', 'signed-page-2'],
    }),
    updateStore: storeUpdate || (() => {}),
  });

  it('excludes PDFs while allowing processed images', () => {
    const step = createStep();

    expect(step.isPdfAtIndex(0)).to.equal(true);
    expect(step.isPdfAtIndex(1)).to.equal(false);
  });

  it('maps a string OCR review reference to the matching page', () => {
    const step = createStep();

    expect(step.getOcrReviewRef(1)).to.deep.equal({
      imageRef: 'signed-page-2',
      pageId: '2',
    });
  });

  it('keeps an accepted OCR correction only in the current store', () => {
    let capturedUpdate = null;
    const step = createStep((update) => { capturedUpdate = update; });
    step.setState = (update, callback) => {
      const next = typeof update === 'function'
        ? update(step.state, step.props)
        : update;
      if (next) step.state = { ...step.state, ...next };
      if (callback) callback();
    };

    step.handleOcrTextChange(1, 'text corectat');

    expect(step.state.ocrResults).to.deep.equal(['prima pagină', 'text corectat']);
    expect(capturedUpdate).to.deep.equal({
      ocrResults: ['prima pagină', 'text corectat'],
    });
  });
});
