import { extractSafetyNotes } from './safety-notes';

describe('extractSafetyNotes', () => {
  it('picks up safety notes from the description', () => {
    const description = [
      'MamaBear Teh Pelancar ASI',
      'Rasa manis alami.',
      '*Catatan: tidak untuk ibu hamil.',
    ].join('\n');
    expect(extractSafetyNotes(description)).toEqual([
      '*Catatan: tidak untuk ibu hamil.',
    ]);
  });

  it('keeps allergen notes', () => {
    expect(
      extractSafetyNotes('*Catatan: mengandung produk turunan sapi.'),
    ).toEqual(['*Catatan: mengandung produk turunan sapi.']);
  });

  it('ignores ordering notes that only share the word "catatan"', () => {
    const description = [
      'Catatan : Tidak untuk Ibu hamil',
      'CATATAN PEMESANAN:',
      '- EstimASI pengiriman produk 3-4 hari kerja',
    ].join('\n');
    expect(extractSafetyNotes(description)).toEqual([
      'Catatan : Tidak untuk Ibu hamil',
    ]);
  });

  it('returns an empty list when there is no safety note', () => {
    expect(extractSafetyNotes('Minuman almond kaya nutrisi.')).toEqual([]);
  });

  it('handles a missing description', () => {
    expect(extractSafetyNotes(null)).toEqual([]);
  });
});
