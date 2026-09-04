import { CacheKeyState } from "./CacheKeyState";
import { sameElement } from "./KeyElementEquality";

/**
 * The key a resource is stored under: the root type, a hop per traversal step, then at most one params
 * object.
 *
 * The state's own restrictions and the query's are merged here rather than at either end, so that key and
 * invalidation set share one normalization and cannot drift apart. A derived relation is applied **last**
 * and replaces any entry for the same path: `/Media(5)/Copies` filtered on `MediumId eq 9` yields
 * `{filter: {MediumId: 5}}`, the same key as the unfiltered call. That query is nonsense - the navigation
 * path already pins `MediumId` to 5 - and the rule stays simple at its expense.
 */
export function buildCacheKey(
  state: CacheKeyState,
  queryParams?: Readonly<Record<string, unknown>>,
): ReadonlyArray<unknown> {
  const params = mergeParams(queryParams, state.params);
  return params ? [state.name, ...state.steps, params] : [state.name, ...state.steps];
}

function mergeParams(
  queryParams: Readonly<Record<string, unknown>> | undefined,
  ownParams: Readonly<Record<string, unknown>> | undefined,
): Record<string, unknown> | undefined {
  const merged: Record<string, unknown> = { ...queryParams };

  for (const [name, value] of Object.entries(ownParams ?? {})) {
    if (name === "filter" && isRecord(value) && isRecord(merged.filter)) {
      // the derived relation wins per path, the query's other assertions survive next to it
      merged.filter = { ...merged.filter, ...value };
    } else {
      merged[name] = value;
    }
  }

  return Object.keys(merged).length ? merged : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * The keys a write makes stale.
 *
 * Four rules: the addressed resource's own key without its params object (a write invalidates the
 * resource however it was filtered, sorted or paged), the resource's own entity set as a bare list key
 * where it belongs to one, the key of every ancestor hop - which is what catches a parent that was
 * fetched with `$expand` - and a bare list-key entry per entity set the write's own payload deep-inserted
 * into (`state.params.deepEdit`, populated by `buildDeepEditHops` at the write's own call site). Entries
 * another entry is a prefix of are dropped; what is left is coarsest first.
 *
 * Rule 2 is skipped where the resource has no entity set of its own - a contained entity, a complex value,
 * a singleton: nothing is ever registered under such a key. `deepEdit` hops read straight off
 * `state.params`, unlike every other params entry: they are not a restriction on the addressed resource
 * the way `filter`/`cast` are, so there is nothing to drop them for - they name additional, unrelated
 * entity sets this same write also touched, each with no key of its own yet since the entity is freshly
 * created.
 *
 * Deliberately does **not** name the resource's children: the ancestor entry covers them by prefix for a
 * hierarchical route, and an application reaching the same resource by some other route it never took
 * invalidates that route's own key, via `ResourceIdentityHandler` - see the cache-key design docs.
 */
export function buildInvalidates(state: CacheKeyState): ReadonlyArray<ReadonlyArray<unknown>> {
  const deepEditHops = (state.params?.deepEdit as ReadonlyArray<string> | undefined) ?? [];

  // ancestors in route order (coarsest first), then the resource itself, then its entity set, then whatever it deep-inserted into
  const candidates: Array<ReadonlyArray<unknown>> = [
    ...(state.ancestors ?? []),
    [state.name, ...state.steps],
    ...(state.entitySetName ? [[state.entitySetName, "list"]] : []),
    ...deepEditHops.map((entitySetName) => [entitySetName, "list"]),
  ];

  // an entry another entry properly prefixes is redundant - invalidating the prefix reaches it
  // anyway. A POST to a collection whose own key equals its bare entity-set entry, which
  // the same pass deduplicates.
  return candidates.filter(
    (candidate, index) =>
      !candidates.some(
        (other, otherIndex) =>
          otherIndex !== index &&
          isPrefixOf(other, candidate) &&
          // on a tie keep the first occurrence, so a duplicate collapses to one entry
          (other.length < candidate.length || otherIndex < index),
      ),
  );
}

function isPrefixOf(prefix: ReadonlyArray<unknown>, key: ReadonlyArray<unknown>): boolean {
  return prefix.length <= key.length && prefix.every((element, index) => sameElement(element, key[index]));
}
