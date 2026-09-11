import type { ResourceIdentityHandler } from "@odata2ts/http-client-api";
import type { CacheKeyState } from "./CacheKeyState";
import { walkEntityGraph } from "./EntityGraphWalk";

/**
 * Records every entity actually present in a *read's* response body against the request's own hierarchical
 * cache key, **with its params object stripped** - the directly addressed resource itself (every row, for
 * a list response) plus every `$expand`'d entity at any depth - so a write reached via a completely
 * different route can later `resolve()` its way back to this one (see `ResourceIdentityHandler`).
 *
 * The recorded key is derived from `state` (`[state.name, ...state.steps]`) rather than built from a params
 * object anyone has to remember to strip: params only ever enter via `buildCacheKey`, so this is already
 * the params-free form, by construction - the same derivation `buildInvalidates` rule 1 uses. A
 * params-carrying key would make every distinct `$filter`/`$top`/`$expand` combination reaching the same
 * entity its own store entry, defeating the store's own per-resource route bound one level down, and would
 * resolve cross-route invalidation to over-specific keys.
 *
 * Read-only by construction, not by a special case here: `hierarchicalKey` is `RequestCmd.cacheKey`, used
 * purely as the read/write signal - it is always `undefined` for a write (mirrors `undefined` right back),
 * since a write was never itself addressable under any read-shaped key for a route to reuse. What a write's
 * own response teaches is `invalidates`' concern instead - see {@link resolveCrossRouteInvalidates}.
 *
 * A contained resource - `entitySetName`/`canonicalIdFn` both absent, on `state` or on a nested visit alike
 * - is never recorded: it has no canonical resource of its own to record against, by construction.
 */
export function recordObservedIdentities(
  resourceIdentity: ResourceIdentityHandler | undefined,
  hierarchicalKey: ReadonlyArray<unknown> | undefined,
  state: CacheKeyState,
  data: unknown,
): void {
  if (!resourceIdentity || !hierarchicalKey || data === undefined || data === null) {
    return;
  }

  const recordedKey = [state.name, ...state.steps];

  const rows = extractRows(data);
  for (const row of rows) {
    recordRow(resourceIdentity, recordedKey, state.canonicalIdFn, row);

    walkEntityGraph(
      state.qEntityFn,
      row,
      (visit) => recordRow(resourceIdentity, recordedKey, visit.buildCanonicalId, visit.data),
      { skipBindings: false },
    );
  }
}

/**
 * The rows a converted response body actually carries - a bare entity for a "detail" response, the
 * elements of a collection otherwise, however that collection happens to be wrapped: `{value: [...]}` (V4,
 * and V2 reshaped `v2ResponseAsV4`), `{d: {results: [...]}}` (V2, `responseResultsWrapping`) or
 * `{results: [...]}` (V2 with the `d` envelope already stripped elsewhere). Same three shapes
 * `getCollectionConcurrencyOptions`'s own `harvest` already unwraps, for the identical reason - none of
 * `value`/`d`/`results` is a legal OData property name, so checking for them structurally, without needing
 * to know which OData version or wrapping option produced this particular body, is safe.
 */
function extractRows(data: unknown): ReadonlyArray<unknown> {
  const body = data as { value?: unknown; d?: { results?: unknown }; results?: unknown };
  if (Array.isArray(body.value)) {
    return body.value;
  }
  if (Array.isArray(body.d?.results)) {
    return body.d!.results as ReadonlyArray<unknown>;
  }
  if (Array.isArray(body.results)) {
    return body.results;
  }
  return [data];
}

/**
 * A single-entity body's own fields, unwrapped from V2's `{d: {...}}` envelope where present - `d` is not a
 * legal OData property name, so its presence is always the envelope, never real entity data.
 */
function extractEntity(data: unknown): Record<string, unknown> | undefined {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return undefined;
  }
  const body = data as { d?: unknown };
  return (body.d && typeof body.d === "object" && !Array.isArray(body.d) ? body.d : data) as Record<string, unknown>;
}

function recordRow(
  resourceIdentity: ResourceIdentityHandler,
  hierarchicalKey: ReadonlyArray<unknown>,
  buildCanonicalId: ((entity: unknown) => string | undefined) | undefined,
  row: unknown,
): void {
  if (!buildCanonicalId || !row || typeof row !== "object") {
    return;
  }
  const canonicalId = buildCanonicalId(row);
  if (canonicalId) {
    resourceIdentity.record(canonicalId, hierarchicalKey);
  }
}

/**
 * The write's own canonical id, built from whichever of two sources is actually available: `state.key` -
 * the write's own address, always known, whatever the response says - wins where present (`PATCH`/`PUT`/
 * `DELETE`, already addressing one entity by key); the response body is the only source for a `POST` to a
 * collection, whose server-assigned key was never known beforehand - unwrapped from a V2 `{d: {...}}`
 * envelope first, the same one `ServiceStateHelperV2.etagOf` already unwraps for the identical reason. Never
 * both at once, and never a list body - a collection response names no single resource to resolve.
 *
 * Shared between {@link resolveCrossRouteInvalidates} and {@link evictObservedIdentity} so the one
 * derivation cannot drift between the two call sites.
 */
function resolveCanonicalId(state: CacheKeyState, data: unknown): string | undefined {
  if (!state.canonicalIdFn) {
    return undefined;
  }
  const source = state.key ?? extractEntity(data);
  return source === undefined ? undefined : state.canonicalIdFn(source);
}

/**
 * Every hierarchical cache key ever `record()`ed as resolving to the very resource this *write* just
 * addressed - added to `invalidates` alongside the write's own route-derived entries (see
 * `buildInvalidates`), so a write reached via one route also invalidates a cache entry some other route
 * filled in.
 *
 * Deliberately narrow: only the write's *own* resource is resolved here, never anything nested inside its
 * payload. A deep-inserted child is brand new - nothing could have cached a route to an entity that did not
 * exist a moment ago - so there is nothing for it to resolve against.
 */
export function resolveCrossRouteInvalidates(
  resourceIdentity: ResourceIdentityHandler | undefined,
  state: CacheKeyState,
  data: unknown,
): ReadonlyArray<ReadonlyArray<unknown>> {
  if (!resourceIdentity) {
    return [];
  }
  const canonicalId = resolveCanonicalId(state, data);
  return canonicalId ? resourceIdentity.resolve(canonicalId) : [];
}

/**
 * Forgets every hierarchical key `record()`ed for the canonical resource a successful `DELETE` just
 * removed (see `ResourceIdentityHandler.evict`) - without it, rule 6 of `buildInvalidates` keeps handing
 * back routes to an entity that no longer exists, on every later write that happens to resolve to the same
 * canonical id, until the store's own bound evicts them by age.
 *
 * Called only for a `DELETE` that actually succeeded - never for a `204` on `PATCH`/`PUT`, which is not a
 * delete, and never for a failed `DELETE` (a `404` says nothing about whether the resource still exists to
 * be evicted from the *store*; it is left to age out like any other stale entry).
 *
 * Shares canonical-id derivation with {@link resolveCrossRouteInvalidates} via {@link resolveCanonicalId} -
 * `state.key` is exactly what makes this possible for a `DELETE`, whose response usually carries no body to
 * read a canonical id from otherwise.
 */
export function evictObservedIdentity(
  resourceIdentity: ResourceIdentityHandler | undefined,
  state: CacheKeyState,
  data: unknown,
): void {
  if (!resourceIdentity) {
    return;
  }
  const canonicalId = resolveCanonicalId(state, data);
  if (canonicalId) {
    resourceIdentity.evict(canonicalId);
  }
}
