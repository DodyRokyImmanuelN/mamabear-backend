const SAFETY_KEYWORDS = [
  'tidak untuk',
  'catatan',
  'peringatan',
  'alergi',
  'kontraindikasi',
  'efek samping',
  'dilarang',
  'hindari',
];

// Lines that contain a safety keyword but are not about product safety
const NON_SAFETY_PREFIXES = ['catatan pemesanan'];

export function extractSafetyNotes(
  description: string | null | undefined,
): string[] {
  return (description ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => {
      const lower = line.toLowerCase();
      return (
        !NON_SAFETY_PREFIXES.some((prefix) => lower.startsWith(prefix)) &&
        SAFETY_KEYWORDS.some((keyword) => lower.includes(keyword))
      );
    });
}
