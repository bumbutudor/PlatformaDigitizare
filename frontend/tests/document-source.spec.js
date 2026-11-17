import { expect } from 'chai';
import OriginalDocumentPreview from '../src/components/OriginalDocumentPreview';
import {
  buildOriginalDocumentCandidates,
  isPdfDocument,
  normalizeMediaUrl,
  toMediaProxyUrl,
} from '../src/utils/DocumentSource';

describe('original document preview', () => {
  it('prefers the original S3 document for the matching page', () => {
    const candidates = buildOriginalDocumentCandidates({
      s3SourceFiles: [
        { url: 'https://s3.example/page-1.jpg' },
        { url: 'https://s3.example/page-2.jpg' },
      ],
      s3PreprocessedFiles: [
        'https://s3.example/pre-1.jpg',
        'https://s3.example/pre-2.jpg',
      ],
    }, 1, 'https://api.example/');

    expect(candidates[0]).to.deep.equal({
      url: 'https://s3.example/page-2.jpg',
      kind: 'image',
      label: 'Documentul original',
    });
  });

  it('recognizes signed PDF URLs and proxies backend media URLs', () => {
    expect(isPdfDocument('https://api.example/media/page.pdf?token=1')).to.equal(true);
    expect(toMediaProxyUrl(
      'https://api.example/media/ocr/page.pdf?token=1',
      'https://api.example/',
    )).to.equal('https://api.example/media-proxy/ocr/page.pdf?token=1');
  });

  it('normalizes a local preprocessed path under the media endpoint', () => {
    expect(normalizeMediaUrl(
      'pre/FR/page.jpg',
      'https://api.example/',
    )).to.equal('https://api.example/media/pre/FR/page.jpg');
  });

  it('advances to the fallback when an image cannot be loaded', () => {
    const preview = new OriginalDocumentPreview({
      candidates: [
        { url: 'missing.jpg', kind: 'image' },
        { url: 'fallback.jpg', kind: 'image' },
      ],
    });
    preview.setState = update => {
      const next = typeof update === 'function'
        ? update(preview.state, preview.props)
        : update;
      preview.state = { ...preview.state, ...next };
    };

    preview.handleMediaError();

    expect(preview.state.candidateIndex).to.equal(1);
  });
});
