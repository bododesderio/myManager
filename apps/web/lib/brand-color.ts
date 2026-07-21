/**
 * Brand color utilities used by BrandProvider and tested independently.
 *
 * Kept in a plain .ts file (no JSX) so the test runner can import it with
 * `--experimental-strip-types` without needing a JSX transform.
 */

/**
 * Validate that `value` is a well-formed six-digit hex color (`#RRGGBB`).
 *
 * [SECURITY] This function is the sole gate between API-supplied color strings
 * and a `<style dangerouslySetInnerHTML>` block. Any value that is not
 * strictly `#` followed by exactly six hex digits is rejected, preventing CSS
 * injection attacks such as:
 *
 *   `red;} body { background: url(javascript:...) }`  — escapes the property
 *   `</style><script>alert(1)</script>`                — escapes the element
 *
 * Three-digit shorthand (`#RGB`) is deliberately excluded: `shade()` expands
 * RGB channels by slicing pairs from the six-character body, and a three-char
 * input would silently produce NaN for the blue channel.
 *
 * @param value    Untrusted input, typically from a JSON API response.
 * @param fallback A known-safe hardcoded default returned on validation failure.
 */
export function validateHexColor(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  if (/^#[0-9A-Fa-f]{6}$/.test(value)) return value;
  return fallback;
}
