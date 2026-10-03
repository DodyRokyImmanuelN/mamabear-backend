export const RECOMMENDATION_PREFIX = 'REKOMENDASI PRODUK:';
export const MAX_RECOMMENDATIONS = 3;

// Toleran terhadap variasi tulisan AI: huruf besar/kecil, markdown (**, _), dan penanda poin (-, *, >)
const FOOTER_LINE_PATTERN =
  /^[ \t>*_-]*rekomendasi[ \t]+produk[ \t*_]*:[ \t*_]*(.*)$/gim;

export function normalizeRecommendationFooter(
  answer: string,
  allowedSlugs: string[],
): string {
  const canonicalBySlug = new Map(
    allowedSlugs.map((slug) => [slug.toLowerCase(), slug]),
  );
  const picked: string[] = [];

  const body = answer.replace(
    FOOTER_LINE_PATTERN,
    (_line, slugList: string) => {
      for (const raw of slugList.split(',')) {
        const canonical = canonicalBySlug.get(
          raw.replace(/[*_`.\s]/g, '').toLowerCase(),
        );
        if (canonical && !picked.includes(canonical)) picked.push(canonical);
      }
      return '';
    },
  );

  const text = body.replace(/\n{3,}/g, '\n\n').trim();
  const slugs = picked.slice(0, MAX_RECOMMENDATIONS);

  return slugs.length > 0
    ? `${text}\n\n${RECOMMENDATION_PREFIX} ${slugs.join(', ')}`
    : text;
}

export function addressUserAsMama(text: string): string {
  return text
    .split('\n')
    .map((line) =>
      line.startsWith(RECOMMENDATION_PREFIX)
        ? line
        : line.replace(/\banda\b/gi, 'Mama'),
    )
    .join('\n');
}

// Order matters: the footer is normalized first so addressUserAsMama can skip it by its prefix
export function formatReply(answer: string, allowedSlugs: string[]): string {
  return addressUserAsMama(normalizeRecommendationFooter(answer, allowedSlugs));
}
