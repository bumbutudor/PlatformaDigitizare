// The backend may store an upload under a different name than the one the user
// picked: Django replaces spaces with underscores, strips characters such as
// parentheses, appends a suffix on name collisions and converts TIFF to PNG.
// Every later step (preprocessing, OCR) looks the file up by name on the
// server, so the step store must carry the name the server actually used.
export const toSourceFileMeta = (meta, uploadResponse) => {
  const response = uploadResponse || {};
  const original = meta || {};
  const serverName = response.s3File && typeof response.s3File.name === 'string'
    ? response.s3File.name.trim()
    : '';

  return {
    ...original,
    originalName: original.name,
    name: serverName || original.name,
    isPdf: Boolean(response.isPdf),
  };
};
