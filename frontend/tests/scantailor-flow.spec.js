import React from 'react';
import { expect } from 'chai';
import ShallowRenderer from 'react-test-renderer/shallow';
import ScanTailor from '../src/components/ScanTailor';
import Step3 from '../src/digitizare/Step3';

const previousCssLoader = require.extensions['.css'];
require.extensions['.css'] = () => {};
const Step2 = require('../src/digitizare/Step2').default;
if (previousCssLoader) require.extensions['.css'] = previousCssLoader;
else delete require.extensions['.css'];

const find = (node, predicate) => {
  if (!React.isValidElement(node)) return null;
  if (predicate(node)) return node;
  let result = null;
  React.Children.forEach(node.props.children, child => { result = result || find(child, predicate); });
  return result;
};

describe('ScanTailor preprocessing and OCR flow', () => {
  let store;
  let renderer;
  let originalFetch;
  const startButton = () => find(renderer.getRenderOutput(), node => node.props.onClick && node.props.children === 'Start preprocesare');
  beforeEach(() => {
    originalFetch = global.fetch;
    store = {
      api: 'https://api.example/', preprocessWith: 'ScanTailor', preprocessMode: 'web',
      sourceFiles: [{ name: 'page.jpg' }], s3SourceFiles: [{ name: 'page.jpg', url: 'https://s3.example/page.jpg', searchablePdfUrl: 'old.pdf' }],
      preprocessedFiles: ['old.png'], s3PreprocessedFiles: ['https://s3.example/old.png'],
      ocrResults: ['old OCR'], ocrReviewRefs: ['old-ref'], transResults: ['old text'], searchablePdfs: ['old.pdf'],
      period: 'secolulXX', alphabet: 'cyrillic',
    };
    renderer = new ShallowRenderer();
    renderer.render(<Step2 getStore={() => store} updateStore={update => { store = { ...store, ...update }; }} jumpToStep={() => {}} />);
  });
  afterEach(() => { global.fetch = originalFetch; renderer.unmount(); });

  it('normalizes local previews and clears old OCR when processing again', async () => {
    global.fetch = async () => ({ json: async () => ({ code: 200, preprocessedFiles: ['pre/ScanTailor/job/page.png'], s3PreprocessedFiles: ['/media/pre/ScanTailor/job/page.png'] }) });
    await startButton().props.onClick();
    expect(store.s3PreprocessedFiles).to.deep.equal(['https://api.example/media/pre/ScanTailor/job/page.png']);
    expect(store.ocrResults).to.deep.equal([]);
    expect(store.searchablePdfs).to.deep.equal([]);
    expect(store.s3SourceFiles[0]).not.to.have.property('searchablePdfUrl');
    expect(startButton()).not.to.equal(null);
  });

  it('shows server errors and allows a retry', async () => {
    global.fetch = async () => ({ json: async () => ({ code: 503, msg: 'ScanTailor CLI lipsește' }) });
    await startButton().props.onClick();
    expect(find(renderer.getRenderOutput(), node => node.props.children === 'ScanTailor CLI lipsește')).not.to.equal(null);
    expect(startButton()).not.to.equal(null);
    expect(store.preprocessedFiles).to.deep.equal([]);
  });

  it('invalidates processed pages when parameters change', () => {
    const options = find(renderer.getRenderOutput(), node => node.type === ScanTailor);
    options.props.onOptionsChange();
    expect(store.preprocessedFiles).to.deep.equal([]);
    expect(store.ocrReviewRefs).to.deep.equal([]);
  });

  it('passes the selected engine to OCR and preserves the Hot Folder error', async () => {
    const step = new Step3({ getStore: () => store, updateStore: () => {} });
    step.setState = update => { step.state = { ...step.state, ...update }; };
    let request;
    step.API.post = async (endpoint, body) => {
      request = body;
      return { code: 503, msg: 'Hot Folder neconfigurat' };
    };
    await step.handleOCRRequest();
    expect(request.preprocessWith).to.equal('ScanTailor');
    expect(request.preprocessMode).to.equal('web');
    expect(step.state.errorMessage).to.equal('Hot Folder neconfigurat');
    expect(step.state.show).to.equal(true);
  });
});
