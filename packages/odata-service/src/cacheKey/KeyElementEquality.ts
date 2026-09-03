/**
 * Element equality for a cache key: primitives compare by value, a key object (a composite key, a params
 * entry) by its serialisation - which is exactly how a cache hashes them, and every value in a key is
 * JSON-serialisable by construction.
 *
 * Shared by {@link buildInvalidates}'s prefix/dedup logic and {@link touchesResource}'s array-needle matching -
 * both need the same notion of "the same element", not just `===`.
 */
export function sameElement(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }
  if (typeof a === "object" && a !== null && typeof b === "object" && b !== null) {
    return JSON.stringify(sortRecord(a)) === JSON.stringify(sortRecord(b));
  }
  return false;
}

function sortRecord(value: object): unknown {
  if (Array.isArray(value)) {
    return value;
  }
  return Object.fromEntries(Object.entries(value).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}
