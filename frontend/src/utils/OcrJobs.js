const aborted = () => Object.assign(new Error('Urmărirea OCR a fost oprită.'), { name: 'AbortError' });

// Seed once with server elapsed time, then use one monotonic browser clock.
// Never subtract a server timestamp from the user's wall clock.
export const createOcrElapsedClock = (initialSeconds, now = () => performance.now()) => {
  const initial = Number.isFinite(initialSeconds) ? Math.max(0, Math.floor(initialSeconds)) : 0;
  const started = now();
  let last = initial;
  return () => {
    last = Math.max(last, initial + Math.floor(Math.max(0, now() - started) / 1000));
    return last;
  };
};

export const waitForOcrPoll = (milliseconds, signal) => new Promise((resolve, reject) => {
  if (signal && signal.aborted) { reject(aborted()); return; }
  const cancel = () => { clearTimeout(timer); reject(aborted()); };
  const timer = setTimeout(() => {
    if (signal) signal.removeEventListener('abort', cancel);
    resolve();
  }, milliseconds);
  if (signal) signal.addEventListener('abort', cancel, { once: true });
});

export const pollOcrJob = async (api, job, { onProgress = () => {}, signal, wait = waitForOcrPoll } = {}) => {
  let data = job;
  while (true) {
    if (signal && signal.aborted) throw aborted();
    onProgress(data);
    if (data.status === 'done' || data.status === 'error' || (data.code && ![200, 202].includes(data.code))) return data;
    if (!['queued', 'processing'].includes(data.status)) throw new Error('Serverul a returnat o stare OCR necunoscută.');
    await wait(2500, signal);
    data = await api.get(`ocr/jobs/${encodeURIComponent(job.id)}/`, { Authorization: `Bearer ${job.token}` }, signal);
  }
};
