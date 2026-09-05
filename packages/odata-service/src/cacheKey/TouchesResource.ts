import { sameElement } from "./KeyElementEquality";

/**
 * Whether the given cache key touches the given `(name, kind, key?)` - exactly the shape of a root or an
 * `[entitySetName, "list"]` entry, wherever it occurs in the key, as a contiguous run - including inside an
 * `expand` entry of its params object, however deeply `expanding()` nested those.
 *
 * A hierarchical key is rooted at the name the route started at, so a prefix match on a name reached
 * further down the route can never reach it - one array has one prefix. This is what makes such a key
 * reachable at all without a generated table alongside it: root and every hop already share this same
 * `(name, kind, key?)` shape, so a plain contiguous scan is all `invalidates` needs.
 *
 * **`expand` entries are searched too, recursively.** They live inside the trailing params object, not as
 * top-level elements, so a plain scan of `key` itself does not find them - a hop hidden two objects deep is
 * still exactly the same `(name, kind)` shape, so the very same matching logic applies to it once found;
 * only *finding* it needs an extra step, which is what this does.
 *
 * Kept library-neutral - it takes a key, not a cache-library query object:
 * `invalidateQueries({predicate: (q) => touchesResource(entry, q.queryKey)})`.
 */
export function touchesResource(needle: ReadonlyArray<unknown>, key: ReadonlyArray<unknown>): boolean {
  if (isPrefixAt(needle, key, 0)) {
    return true;
  }
  return expandHopsOf(key).some((hop) => isPrefixAt(needle, hop, 0));
}

function isPrefixAt(needle: ReadonlyArray<unknown>, haystack: ReadonlyArray<unknown>, start: number): boolean {
  for (let offset = start; offset <= haystack.length - needle.length; offset++) {
    if (needle.every((element, index) => sameElement(element, haystack[offset + index]))) {
      return true;
    }
  }
  return false;
}

/**
 * Every `(name, kind)` hop reachable through an `expand` entry of any params object among `key`'s own
 * elements - recursively, since a hop's own 3rd element may carry further nested params with an `expand`
 * of its own. A bare (unenriched) expand entry is just a rendered path string and contributes nothing here
 * - there is no name to find in it beyond what a plain scan of `key` already covers.
 */
function expandHopsOf(key: ReadonlyArray<unknown>): Array<ReadonlyArray<unknown>> {
  const hops: Array<ReadonlyArray<unknown>> = [];
  for (const element of key) {
    if (typeof element === "object" && element !== null && !Array.isArray(element)) {
      collectExpandHops(element as Record<string, unknown>, hops);
    }
  }
  return hops;
}

function collectExpandHops(params: Record<string, unknown>, out: Array<ReadonlyArray<unknown>>): void {
  const expand = params.expand;
  if (!Array.isArray(expand)) {
    return;
  }
  for (const entry of expand) {
    if (!Array.isArray(entry)) {
      continue;
    }
    out.push(entry);
    const nestedParams = entry[2];
    if (typeof nestedParams === "object" && nestedParams !== null) {
      collectExpandHops(nestedParams as Record<string, unknown>, out);
    }
  }
}
