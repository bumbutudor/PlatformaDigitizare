export const removeOcrUnknownMarkers = (text) => (
  typeof text === 'string' ? text.replace(/\^/g, '') : text
);

export const cleanOcrResults = (results) => (
  Array.isArray(results) ? results.map(text => (
    typeof text === 'string' ? removeOcrUnknownMarkers(text).replace(/\uFEFF/g, '') : ''
  )) : []
);

export const hasOcrText = (text) => (
  typeof text === 'string'
  && removeOcrUnknownMarkers(text).replace(/[\uFEFF\u200B-\u200D\u2060]/g, '').trim().length > 0
);
