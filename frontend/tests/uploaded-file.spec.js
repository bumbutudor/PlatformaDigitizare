import assert from 'assert';
import { toSourceFileMeta } from '../src/utils/UploadedFile';

describe('uploaded file metadata', () => {
  it('uses the name the server stored the file under', () => {
    const meta = {
      name: 'Pisania bisericii Invierea Domnului-trunchiat.jpg',
      size: 10,
    };
    const result = toSourceFileMeta(meta, {
      s3File: {
        name: 'Pisania_bisericii_Invierea_Domnului-trunchiat.jpg',
        url: 'https://example.test/x.jpg',
      },
    });

    assert.strictEqual(
      result.name,
      'Pisania_bisericii_Invierea_Domnului-trunchiat.jpg',
    );
    assert.strictEqual(
      result.originalName,
      'Pisania bisericii Invierea Domnului-trunchiat.jpg',
    );
    assert.strictEqual(result.size, 10);
    assert.strictEqual(result.isPdf, false);
  });

  it('follows a server-side format conversion and keeps the PDF flag', () => {
    assert.strictEqual(
      toSourceFileMeta({ name: 'scan.tiff' }, { s3File: { name: 'scan.png' } }).name,
      'scan.png',
    );
    assert.strictEqual(
      toSourceFileMeta(
        { name: 'Chiparus_10(202)_1966.pdf' },
        { isPdf: true, s3File: { name: 'Chiparus_10202_1966.pdf' } },
      ).isPdf,
      true,
    );
  });

  it('falls back to the picked name when the server sends none', () => {
    const meta = { name: '5.jpg' };
    assert.strictEqual(toSourceFileMeta(meta, {}).name, '5.jpg');
    assert.strictEqual(toSourceFileMeta(meta, { s3File: {} }).name, '5.jpg');
    assert.strictEqual(toSourceFileMeta(meta, undefined).name, '5.jpg');
    assert.deepStrictEqual(meta, { name: '5.jpg' });
  });
});
