import assert from 'assert';
import { pollOcrJob, createOcrElapsedClock } from '../src/utils/OcrJobs';

describe('OCR elapsed time', () => {
  it('advances from server elapsed time using one monotonic clock', () => {
    let now = 10000;
    const elapsed = createOcrElapsedClock(6, () => now);
    assert.strictEqual(elapsed(), 6);
    now += 1100;
    assert.strictEqual(elapsed(), 7);
    now += 13000;
    assert.strictEqual(elapsed(), 20);
    now -= 1000;
    assert.strictEqual(elapsed(), 20);
  });

  it('never begins with negative, invalid or fractional seconds', () => {
    [-10, NaN, undefined, Infinity].forEach(value => {
      assert.strictEqual(createOcrElapsedClock(value, () => 0)(), 0);
    });
    assert.strictEqual(createOcrElapsedClock(6.9, () => 0)(), 6);
  });
});

describe('Asynchronous OCR jobs', () => {
  const job = { id: 'job-1', token: 'job-capability', status: 'queued', code: 202 };
  const wait = async () => {};

  it('polls queued and processing jobs and returns the completed result', async () => {
    const states = [];
    const replies = [{ status: 'processing', code: 202 }, { status: 'done', code: 200, ocrResults: ['text'], searchablePdfs: ['page.pdf'] }];
    const api = { get: async (url, headers) => {
      assert.strictEqual(url, 'ocr/jobs/job-1/');
      assert.strictEqual(headers.Authorization, 'Bearer job-capability');
      return replies.shift();
    } };
    const result = await pollOcrJob(api, job, { wait, onProgress: data => states.push(data.status) });
    assert.deepStrictEqual(states, ['queued', 'processing', 'done']);
    assert.deepStrictEqual(result.ocrResults, ['text']);
  });

  it('preserves a timeout message for the retry UI', async () => {
    const failure = { status: 'error', code: 504, error: 'ocr_timeout', msg: 'page.png: timeout 300 s' };
    assert.deepStrictEqual(await pollOcrJob({ get: async () => failure }, job, { wait }), failure);
  });

  it('preserves empty-text errors and allows a successful new job on retry', async () => {
    const failure = { status: 'error', code: 422, error: 'ocr_no_text', msg: 'Modelul OCR nu a recunoscut niciun text.' };
    const api = { get: async () => failure };
    assert.strictEqual((await pollOcrJob(api, job, { wait })).error, 'ocr_no_text');
    api.get = async () => ({ status: 'done', code: 200, ocrResults: ['retry text'] });
    assert.deepStrictEqual((await pollOcrJob(api, { ...job, id: 'retry' }, { wait })).ocrResults, ['retry text']);
  });

  it('stops polling when the step is unmounted', async () => {
    const controller = new AbortController();
    controller.abort();
    let calls = 0;
    try {
      await pollOcrJob({ get: async () => { calls += 1; } }, job, { wait, signal: controller.signal });
      assert.fail('Expected cancellation');
    } catch (error) { assert.strictEqual(error.name, 'AbortError'); }
    assert.strictEqual(calls, 0);
  });
});
