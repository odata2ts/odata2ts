import { CacheKeyState } from "./CacheKeyState";
import { sameElement } from "./KeyElementEquality";

/**
 * The key a resource is stored under: the root type, a hop per traversal step, then at most one params
 * object.
 *
 * The state's own restrictions and the query's are merged here rather than at either end, so that key and
 * invalidation set share one normalization and cannot drift apart.
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
  const merged: Record<string, unknown> = { ...queryParams, ...ownParams };
  return Object.keys(merged).length ? merged : undefined;
}

/**
 * The keys a write makes stale.
 *
 * Five rules: the addressed resource's own key without its params object (a write invalidates the
 * resource however it was filtered, sorted or paged), the resource's own entity set as a bare list key
 * where it belongs to one, the key of every ancestor hop - which is what catches a parent that was
 * fetched with `$expand` - a bare list-key entry per entity set the write's own payload deep-inserted
 * into (`state.params.deepEdit`, populated by `buildDeepEditHops` at the write's own call site), and
 * whatever hierarchical keys `crossRouteKeys` names - a route to this same resource the write's own route
 * never took, resolved via `ResourceIdentityHandler` from what an earlier response actually observed (see
 * `resolveCrossRouteInvalidates`; empty, never computed here, for a client with no such store). Entries
 * another entry is a prefix of are dropped; what is left is coarsest first.
 *
 * Rule 2 applies wherever a "detail" key goes stale and the entity set it belongs to is known - not just
 * the addressed resource itself, but every ancestor hop too (rule 3): a list is a query *over* an entity
 * set, so any of that set's members turning stale is reason enough to also invalidate the set's own bare
 * list key, whichever hop the member was reached through. Skipped wherever the resource has no entity set
 * of its own - a contained entity, a complex value, a singleton: nothing is ever registered under such a
 * key. `deepEdit` hops read straight off `state.params`, unlike every other params entry: they are not a
 * restriction on the addressed resource the way `filter`/`cast` are, so there is nothing to drop them for -
 * they name additional, unrelated entity sets this same write also touched, each with no key of its own yet
 * since the entity is freshly created.
 *
 * Deliberately does **not** enumerate the resource's children on its own: the ancestor entry covers them
 * by prefix for a hierarchical route, and `crossRouteKeys` is what reaches a route this write never took.
 */
export function buildInvalidates(
  state: CacheKeyState,
  crossRouteKeys: ReadonlyArray<ReadonlyArray<unknown>> = [],
): ReadonlyArray<ReadonlyArray<unknown>> {
  const deepEditHops = (state.params?.deepEdit as ReadonlyArray<string> | undefined) ?? [];

  const ancestorEntries = (state.ancestors ?? []).flatMap((ancestor) =>
    ancestor.entitySetName ? [ancestor.key, [ancestor.entitySetName, "list"]] : [ancestor.key],
  );

  // ancestors in route order (coarsest first, each with its own list form alongside), then the resource
  // itself, then its entity set, then whatever it deep-inserted into, then whatever another route to this
  // same resource already has cached
  const candidates: Array<ReadonlyArray<unknown>> = [
    ...ancestorEntries,
    [state.name, ...state.steps],
    ...(state.entitySetName ? [[state.entitySetName, "list"]] : []),
    ...deepEditHops.map((entitySetName) => [entitySetName, "list"]),
    ...crossRouteKeys,
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
