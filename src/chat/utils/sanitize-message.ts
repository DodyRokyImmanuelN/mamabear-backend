// Control characters, except tab and newline
const CONTROL_CHARS = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g;
// Zero-width, BOM, line/paragraph separators and bidi overrides; U+200D (ZWJ) is kept for emoji like 👩‍🍼
const INVISIBLE_CHARS =
  /[\u200B\u200C\u200E\u200F\u2028-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g;

export function sanitizeMessage(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  return value
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL_CHARS, '')
    .replace(INVISIBLE_CHARS, '')
    .trim();
}
