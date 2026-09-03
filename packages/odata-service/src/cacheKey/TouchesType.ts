import { sameElement } from "./KeyElementEquality";

/**
 * Whether the given cache key touches the given type, or - the array form - a specific `(type, kind,
 * key?)` triple, wherever it occurs in the key.
 *
 * A hierarchical key is rooted at the type of the entity set the route started at, so a prefix match on a
 * type or resource reached further down the route can never reach it - one array has one prefix. This is
 * what makes such a key reachable by type or by resource at all, and because every structured hop carries
 * its FQN it is a plain scan needing nothing generated alongside it.
 *
 * **The string form** looks for a bare type name as an element (or the `cast` entry of a params object) -
 * a deliberately coarse "this type may be stale somewhere" check, meant for a caller who only has a type
 * name to go on (an external notification, an `entityTypeName`-driven manual invalidation).
 *
 * **The array form** is what every entry of `invalidates` should be run through: it looks for the given
 * `(type, kind, key?)` - exactly the shape of a root, a re-rooted key, or the type-wide `[type, "list"]`
 * entry - as a contiguous run, at any offset. Since a nested hop's shape is `[type, kind, name, key?]` (the
 * navigation property's name interposed, needed to keep two same-typed sibling properties apart - see
 * "Both the type and the name are in a hop" in the cache-key docs), the match additionally accepts exactly
 * one skipped element, but only immediately after a kind marker (`"list"`/`"detail"`) - never anywhere
 * else. That is the one place a name can legitimately sit between what a canonical, route-independent key
 * says and what a hop reachable through some other, unrelated route actually looks like; skipping
 * anywhere else would risk matching data that only coincidentally shares elements in the right order.
 *
 * This is why passing an `invalidates` entry through this function is strictly more than a prefix match on
 * that same entry: every match a prefix would have found, it still finds (the no-skip path degenerates to
 * exactly that), plus the same resource or type reached through a route the write itself never took.
 *
 * Kept library-neutral - it takes a key, not a cache-library query object:
 * `invalidateQueries({predicate: (q) => touchesType(entry, q.queryKey)})`.
 *
 * **Matching is exact; there is no inheritance.** A key carrying `Library.Catalog.Book` does not match
 * `Library.Catalog.Medium`. Making supertypes match would mean generating and shipping a type-hierarchy
 * table; an application that cares calls this once per subtype it knows.
 */
export function touchesType(needle: string | ReadonlyArray<unknown>, key: ReadonlyArray<unknown>): boolean {
  if (typeof needle === "string") {
    return touchesBareType(needle, key);
  }
  for (let start = 0; start < key.length; start++) {
    if (matchesFrom(needle, key, 0, start)) {
      return true;
    }
  }
  return false;
}

function touchesBareType(type: string, key: ReadonlyArray<unknown>): boolean {
  // Only type names (FQNs) contain dots; property names don't. A search term without a dot can't be a type.
  if (!type.includes(".")) {
    return false;
  }

  for (const element of key) {
    if (element === type) {
      return true;
    }
    if (typeof element === "object" && element !== null && !Array.isArray(element)) {
      if ((element as Record<string, unknown>).cast === type) {
        return true;
      }
    }
  }
  return false;
}

const KIND_MARKERS = new Set(["list", "detail"]);

/**
 * Whether `needle` matches `key` starting exactly at `keyIndex`, consuming both left to right.
 *
 * The one degree of freedom: right after a kind marker `needle` expects, `key` may carry one extra element
 * `needle` does not - a navigation property's name, present only in a nested hop's shape
 * (`[type, kind, name, key?]`), absent from a root's or a re-rooted key's (`[type, kind, key?]`). The
 * no-skip continuation is always tried first, so a needle that matches without any skip - the common case,
 * including every plain prefix match - never takes the skip path at all.
 */
function matchesFrom(
  needle: ReadonlyArray<unknown>,
  key: ReadonlyArray<unknown>,
  needleIndex: number,
  keyIndex: number,
): boolean {
  if (needleIndex === needle.length) {
    return true;
  }
  if (keyIndex >= key.length || !sameElement(needle[needleIndex], key[keyIndex])) {
    return false;
  }
  if (matchesFrom(needle, key, needleIndex + 1, keyIndex + 1)) {
    return true;
  }

  const matchedElement = needle[needleIndex];
  const isKindMarker = typeof matchedElement === "string" && KIND_MARKERS.has(matchedElement);
  return (
    isKindMarker &&
    keyIndex + 1 < key.length &&
    typeof key[keyIndex + 1] === "string" &&
    matchesFrom(needle, key, needleIndex + 1, keyIndex + 2)
  );
}
