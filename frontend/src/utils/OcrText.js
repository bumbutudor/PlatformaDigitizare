export const removeOcrUnknownMarkers = (text) => (
  typeof text === 'string' ? text.replace(/\^/g, '') : text
);

export const cleanOcrResults = (results) => (
  Array.isArray(results) ? results.map(removeOcrUnknownMarkers) : []
);
