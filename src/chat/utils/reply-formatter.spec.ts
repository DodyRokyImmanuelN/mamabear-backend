import {
  MAX_RECOMMENDATIONS,
  addressUserAsMama,
  formatReply,
  normalizeRecommendationFooter,
} from './reply-formatter';

const ALMONMIX = 'mamabear-almonmix-isi-6-sachet';
const TEH = 'mamabear-teh-pelancar-asi-isi-20-sachet';
const KAPSUL = 'mamabear-asi-booster-30-kapsul';
const ZOYAMIX = 'mamabear-zoyamix-rasa-cokelat-isi-10-sachet';
const ALLOWED = [ALMONMIX, TEH, KAPSUL, ZOYAMIX];
const BODY = 'Halo Mama, AlmonMix cocok untuk pelancar ASI.';

describe('normalizeRecommendationFooter', () => {
  it('keeps a well-formed footer', () => {
    const answer = `${BODY}\n\nREKOMENDASI PRODUK: ${ALMONMIX}`;
    expect(normalizeRecommendationFooter(answer, ALLOWED)).toBe(answer);
  });

  it.each([
    ['bold', `**REKOMENDASI PRODUK:** ${ALMONMIX}`],
    ['bold before colon', `**REKOMENDASI PRODUK**: ${ALMONMIX}`],
    ['lowercase', `rekomendasi produk: ${ALMONMIX}`],
    ['bullet', `- REKOMENDASI PRODUK: ${ALMONMIX}`],
    ['bold slug with trailing period', `REKOMENDASI PRODUK: **${ALMONMIX}**.`],
  ])('normalizes a %s footer', (_label, footer) => {
    expect(normalizeRecommendationFooter(`${BODY}\n\n${footer}`, ALLOWED)).toBe(
      `${BODY}\n\nREKOMENDASI PRODUK: ${ALMONMIX}`,
    );
  });

  it('drops slugs that were not retrieved', () => {
    const answer = `${BODY}\n\nREKOMENDASI PRODUK: ${ALMONMIX}, produk-karangan-ai`;
    expect(normalizeRecommendationFooter(answer, ALLOWED)).toBe(
      `${BODY}\n\nREKOMENDASI PRODUK: ${ALMONMIX}`,
    );
  });

  it('removes the footer entirely when no slug is valid', () => {
    const answer = `${BODY}\n\nREKOMENDASI PRODUK: produk-karangan-ai`;
    expect(normalizeRecommendationFooter(answer, ALLOWED)).toBe(BODY);
  });

  it('returns the answer unchanged when there is no footer', () => {
    expect(normalizeRecommendationFooter(BODY, ALLOWED)).toBe(BODY);
  });

  it('deduplicates slugs', () => {
    const answer = `${BODY}\n\nREKOMENDASI PRODUK: ${ALMONMIX}, ${ALMONMIX}, ${TEH}`;
    expect(normalizeRecommendationFooter(answer, ALLOWED)).toBe(
      `${BODY}\n\nREKOMENDASI PRODUK: ${ALMONMIX}, ${TEH}`,
    );
  });

  it(`keeps at most ${MAX_RECOMMENDATIONS} slugs`, () => {
    const answer = `${BODY}\n\nREKOMENDASI PRODUK: ${ALMONMIX}, ${TEH}, ${KAPSUL}, ${ZOYAMIX}`;
    expect(normalizeRecommendationFooter(answer, ALLOWED)).toBe(
      `${BODY}\n\nREKOMENDASI PRODUK: ${ALMONMIX}, ${TEH}, ${KAPSUL}`,
    );
  });

  it('merges repeated footers into a single line at the end', () => {
    const answer = `REKOMENDASI PRODUK: ${ALMONMIX}\n${BODY}\n\nREKOMENDASI PRODUK: ${TEH}`;
    expect(normalizeRecommendationFooter(answer, ALLOWED)).toBe(
      `${BODY}\n\nREKOMENDASI PRODUK: ${ALMONMIX}, ${TEH}`,
    );
  });

  it('matches slugs case-insensitively and outputs the stored slug', () => {
    const answer = `${BODY}\n\nREKOMENDASI PRODUK: almonmix-baru`;
    expect(normalizeRecommendationFooter(answer, ['AlmonMix-Baru'])).toBe(
      `${BODY}\n\nREKOMENDASI PRODUK: AlmonMix-Baru`,
    );
  });

  it('does not leave stacked blank lines where a mid-text footer was removed', () => {
    const answer = `Paragraf satu.\n\nREKOMENDASI PRODUK: ${ALMONMIX}\n\nParagraf dua.`;
    expect(normalizeRecommendationFooter(answer, ALLOWED)).toBe(
      `Paragraf satu.\n\nParagraf dua.\n\nREKOMENDASI PRODUK: ${ALMONMIX}`,
    );
  });

  it('produces a footer the frontend parser can read', () => {
    // Copy of the regex in mamabear-frontend/src/features/chat/utils/recommendations.ts
    const FRONTEND_PATTERN = /^REKOMENDASI\s+PRODUK:[ \t]*([^\n]*)$/m;
    const answer = `${BODY}\n\n**rekomendasi produk:** ${ALMONMIX}, ${TEH}`;
    const result = normalizeRecommendationFooter(answer, ALLOWED);
    expect(result.match(FRONTEND_PATTERN)?.[1]).toBe(`${ALMONMIX}, ${TEH}`);
  });
});

describe('addressUserAsMama', () => {
  it.each([
    [
      'mid-sentence',
      'Produk ini bisa Anda pertimbangkan.',
      'Produk ini bisa Mama pertimbangkan.',
    ],
    [
      'sentence start',
      'Anda bisa mencoba AlmonMix.',
      'Mama bisa mencoba AlmonMix.',
    ],
    [
      'lowercase',
      'cocok untuk anda yang menyusui',
      'cocok untuk Mama yang menyusui',
    ],
    ['uppercase', 'KHUSUS UNTUK ANDA', 'KHUSUS UNTUK Mama'],
  ])('replaces "Anda" (%s)', (_label, input, expected) => {
    expect(addressUserAsMama(input)).toBe(expected);
  });

  it('leaves words that merely contain "anda" untouched', () => {
    const text = 'Produk andalan kami beraroma pandan, andaikan Mama suka.';
    expect(addressUserAsMama(text)).toBe(text);
  });

  it('never alters the recommendation footer line', () => {
    const text =
      'Silakan Anda coba.\n\nREKOMENDASI PRODUK: mamabear-teh-anda-isi-20';
    expect(addressUserAsMama(text)).toBe(
      'Silakan Mama coba.\n\nREKOMENDASI PRODUK: mamabear-teh-anda-isi-20',
    );
  });

  it('returns text without "Anda" unchanged', () => {
    const text = 'Halo Mama, ada yang bisa dibantu?';
    expect(addressUserAsMama(text)).toBe(text);
  });
});

describe('formatReply', () => {
  it('normalizes the footer before replacing "Anda", keeping slugs intact', () => {
    const answer =
      'Silakan Anda coba.\n\n**Rekomendasi produk:** mamabear-teh-anda-isi-20';
    expect(formatReply(answer, ['mamabear-teh-anda-isi-20'])).toBe(
      'Silakan Mama coba.\n\nREKOMENDASI PRODUK: mamabear-teh-anda-isi-20',
    );
  });
});
