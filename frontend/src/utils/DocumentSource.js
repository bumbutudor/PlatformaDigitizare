const valueUrl = value => {
  if (typeof value === 'string') return value;
  if (value && typeof value.url === 'string') return value.url;
  return '';
};

const absoluteOrBrowserUrl = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;

export const isPdfDocument = (url, explicitPdf = false) => (
  Boolean(explicitPdf)
  || /\.pdf(?:$|[?#])/i.test(url || '')
);

export const normalizeMediaUrl = (value, apiBase) => {
  const url = valueUrl(value).trim();
  if (!url || absoluteOrBrowserUrl.test(url)) return url;

  const base = (apiBase || '').replace(/\/?$/, '/');
  let path = url.replace(/\\/g, '/').replace(/^\/+/, '');
  if (path.indexOf('media/') === 0) path = path.slice('media/'.length);
  return `${base}media/${path}`;
};

export const toMediaProxyUrl = (url, apiBase) => {
  if (!url) return '';
  const mediaMatch = url.match(/\/media\/([^?#]+)([?#].*)?$/i);
  if (!mediaMatch) return url;
  const base = (apiBase || '').replace(/\/?$/, '/');
  return `${base}media-proxy/${mediaMatch[1]}${mediaMatch[2] || ''}`;
};

export const buildOriginalDocumentCandidates = (sources, index, apiBase) => {
  const {
    s3SourceFiles = [],
    sourceFiles = [],
    searchablePdfs = [],
    s3PreprocessedFiles = [],
    preprocessedFiles = [],
  } = sources || {};
  const candidates = [];
  const seen = new Set();

  const addCandidate = (value, label, explicitPdf = false, normalize = false) => {
    const url = normalize
      ? normalizeMediaUrl(value, apiBase)
      : valueUrl(value).trim();
    if (!url || seen.has(url)) return;
    seen.add(url);
    candidates.push({
      url,
      kind: isPdfDocument(url, explicitPdf) ? 'pdf' : 'image',
      label,
    });
  };

  const cloudOriginal = s3SourceFiles[index] || {};
  const localOriginal = sourceFiles[index] || {};
  addCandidate(
    cloudOriginal,
    'Documentul original',
    Boolean(cloudOriginal.isPdf),
  );
  addCandidate(
    cloudOriginal.searchablePdfUrl || searchablePdfs[index],
    'PDF OCR pentru verificare',
    true,
  );
  addCandidate(
    s3PreprocessedFiles[index],
    'Imaginea folosită la OCR',
  );
  addCandidate(
    preprocessedFiles[index],
    'Imaginea locală folosită la OCR',
    false,
    true,
  );
  // The upload preview is normally revoked after upload, so it is last.
  addCandidate(
    localOriginal.previewUrl,
    'Previzualizare locală',
    Boolean(localOriginal.isPdf),
  );

  return candidates;
};
