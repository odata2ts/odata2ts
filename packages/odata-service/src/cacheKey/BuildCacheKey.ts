import { CacheKeyState, keyedEntitySetFormOf } from "./CacheKeyState";
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
 * Six rules: (1) the addressed resource's own key without its params object (a write invalidates the
 * resource however it was filtered, sorted or paged); (2) the same resource's own key in bare
 * `[entitySetName, "detail", key]` form (see below - deterministic, so a write through a hop route also
 * invalidates a direct route's cache entry with no `ResourceIdentityHandler` involved); (3) the resource's
 * own entity set as a bare list key where it belongs to one; (4) every ancestor hop's own key - which is
 * what catches a parent that was fetched with `$expand` - each paired with its own bare list form, and,
 * exactly like rule 2, its own bare `[entitySetName, "detail", key]` form where that ancestor was itself
 * narrowed by a key of its own; (5) a bare list-key entry per entity set the write's own payload
 * deep-inserted into (`state.params.deepEdit`, populated by `buildDeepEditHops` at the write's own call
 * site); and (6) whatever hierarchical keys `crossRouteKeys` names - a route to this same resource the
 * write's own route never took, resolved via `ResourceIdentityHandler` from what an earlier response
 * actually observed (see `resolveCrossRouteInvalidates`; empty, never computed here, for a client with no
 * such store). Entries another entry is a prefix of are dropped; what is left is coarsest first.
 *
 * Rule 2 exists because a *longer* key can never be found by scanning a *shorter* one it was derived from:
 * `withKey` already renames a statically-keyed hop's own segment to its entity set's name (`CacheKeyState.ts`),
 * so `["Publishers","detail",1,"Media","detail",id]` already contains `["Media","detail",id]` as a plain,
 * `touchesResource`-findable suffix - but the reverse direction (a *direct* write's own short key finding a
 * *hop*-routed query's longer, cached one) needs that short form to exist as its own candidate here, not
 * just as a substring of the resource's own (usually longer, and usually dropped as ancestor-redundant)
 * rule-1 entry. At the root the two rules produce the identical entry and collapse into one via the same
 * redundancy pass rule 4 already needs.
 *
 * Rule 4's own short-form addition exists for the identical reason, one level up: an ancestor's own full
 * key (`ancestor.key`) is itself hierarchical - prefixed by *its* ancestors in turn - so scanning it alone
 * can never find a direct route's shorter, cached key either, even once that ancestor's own hop segment has
 * been renamed to its entity set's name. A write three hops deep, through an ancestor whose own name
 * diverges from its entity set (`Publishers(1).Books(id).Copies(...)`, where `Books` binds to `Media`),
 * needs `["Media","detail",id]` as its own candidate to still invalidate a *direct* `Media(id)` route's
 * cached query - `ancestor.key` alone (`["Publishers","detail",1,"Media","detail",id]`) cannot reach it.
 * `CacheKeyState.hopState` precomputes this short form per ancestor for exactly this rule to consume.
 *
 * Rule 3 (and rule 4's own list form) applies wherever a "detail" key goes stale and the entity set it
 * belongs to is known - not just the addressed resource itself, but every ancestor hop too: a list is a
 * query *over* an entity set, so any of that set's members turning stale is reason enough to also invalidate
 * the set's own bare list key, whichever hop the member was reached through. Skipped wherever the resource
 * has no entity set of its own - a contained entity, a complex value, a singleton: nothing is ever
 * registered under such a key. `deepEdit` hops read straight off `state.params`, unlike every other params
 * entry: they are not a restriction on the addressed resource the way `filter`/`cast` are, so there is
 * nothing to drop them for - they name additional, unrelated entity sets this same write also touched, each
 * with no key of its own yet since the entity is freshly created.
 *
 * Deliberately does **not** enumerate the resource's children on its own: the ancestor entry covers them
 * by prefix for a hierarchical route, and `crossRouteKeys` is what reaches a route this write never took.
 */
export function buildInvalidates(
  state: CacheKeyState,
  crossRouteKeys: ReadonlyArray<ReadonlyArray<unknown>> = [],
): ReadonlyArray<ReadonlyArray<unknown>> {
  const deepEditHops = (state.params?.deepEdit as ReadonlyArray<string> | undefined) ?? [];
  const keyedEntitySetForm = keyedEntitySetFormOf(state);

  const ancestorEntries = (state.ancestors ?? []).flatMap((ancestor) => [
    ancestor.key,
    ...(ancestor.entitySetName ? [[ancestor.entitySetName, "list"]] : []),
    ...(ancestor.keyedEntitySetForm ? [ancestor.keyedEntitySetForm] : []),
  ]);

  // ancestors in route order (coarsest first, each with its own list form alongside), then the resource
  // itself, its bare entity-set-keyed form, then its entity set, then whatever it deep-inserted into, then
  // whatever another route to this same resource already has cached
  const candidates: Array<ReadonlyArray<unknown>> = [
    ...ancestorEntries,
    [state.name, ...state.steps],
    ...(keyedEntitySetForm ? [keyedEntitySetForm] : []),
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
