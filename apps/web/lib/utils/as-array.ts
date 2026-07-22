/**
 * Coerce an API payload to an array, tolerating either a bare array or an
 * object wrapper (e.g. `{ data: [...] }`, `{ posts: [...] }`). The candidate
 * keys are tried in order; anything else — including an error body or an
 * unexpected object — yields `[]`.
 *
 * This exists because the API returns collection payloads inconsistently
 * (bare arrays for some endpoints, `{ data, pagination }` for others), and a
 * single widget receiving an unexpected shape must never `.map`/`.slice`-crash
 * the whole page.
 */
export function asArray<T = unknown>(value: unknown, ...keys: string[]): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    for (const key of keys) {
      const inner = (value as Record<string, unknown>)[key];
      if (Array.isArray(inner)) return inner as T[];
    }
  }
  return [];
}
