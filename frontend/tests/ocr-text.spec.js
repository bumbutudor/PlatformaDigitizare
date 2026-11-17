import assert from 'assert';
import {
  cleanOcrResults,
  removeOcrUnknownMarkers,
} from '../src/utils/OcrText';

describe('OCR artifact cleanup', () => {
  it('removes the FineReader unknown-glyph marker', () => {
    assert.strictEqual(removeOcrUnknownMarkers('^ЇС'), 'ЇС');
  });

  it('removes only ASCII carets and preserves surrounding text', () => {
    assert.strictEqual(
      removeOcrUnknownMarkers('alui ^ЇС\na^ b ^^c'),
      'alui ЇС\na b c',
    );
  });

  it('cleans every OCR result without mutating the input array', () => {
    const input = ['^ЇС', 'сꙋпт ^дестоиничїѧ'];
    const result = cleanOcrResults(input);

    assert.deepStrictEqual(result, ['ЇС', 'сꙋпт дестоиничїѧ']);
    assert.deepStrictEqual(input, ['^ЇС', 'сꙋпт ^дестоиничїѧ']);
  });
});
