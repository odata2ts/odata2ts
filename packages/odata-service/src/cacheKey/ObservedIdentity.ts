import type { ResourceIdentityHandler } from "@odata2ts/http-client-api";
import type { CacheKeyState } from "./CacheKeyState";
import { walkEntityGraph } from "./EntityGraphWalk";

/**
 * Records every entity actually present in a *read's* response body against the request's own hierarchical
 * cache key - the directly addressed resource itself (every row, for a list response) plus every
 * `$expand`'d entity at any depth - so a write reached via a completely different route can later
 * `resolve()` its way back to this one (see `ResourceIdentityHandler`).
 *
 * Read-only by construction, not by a special case here: `hierarchicalKey` is `RequestCmd.cacheKey`, which
 * is always `undefined` for a write (mirrors `undefined` right back), since a write was never itself
 * addressable under any read-shaped key for a route to reuse. What a write's own response teaches is
 * `invalidates`' concern instead - see {@link resolveCrossRouteInvalidates}.
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

  // a V4/V2-wrapped collection response is `{value: [...]}`, never a bare array itself - the same
  // unwrapping `getCollectionConcurrencyOptions`'s own `harvest` already does for the identical reason
  const rows: ReadonlyArray<unknown> = Array.isArray((data as { value?: unknown }).value)
    ? ((data as { value: ReadonlyArray<unknown> }).value)
    : [data];
  for (const row of rows) {
    recordRow(resourceIdentity, hierarchicalKey, state.canonicalIdFn, row);

    walkEntityGraph(
      state.qEntityFn,
      row,
      (visit) => recordRow(resourceIdentity, hierarchicalKey, visit.buildCanonicalId, visit.data),
      { skipBindings: false },
    );
  }
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
 * Every hierarchical cache key ever `record()`ed as resolving to the very resource this *write* just
 * addressed - added to `invalidates` alongside the write's own route-derived entries (see
 * `buildInvalidates`), so a write reached via one route also invalidates a cache entry some other route
 * filled in.
 *
 * The write's own canonical id is built from whichever of two sources is actually available: `state.key` -
 * the write's own address, always known, whatever the response says - wins where present (`PATCH`/`PUT`/
 * `DELETE`, already addressing one entity by key); the response body is the only source for a `POST` to a
 * collection, whose server-assigned key was never known beforehand. Never both at once, and never a list
 * body - a collection response names no single resource to resolve.
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
  if (!resourceIdentity || !state.canonicalIdFn) {
    return [];
  }

  const source = state.key ?? (data && typeof data === "object" && !Array.isArray(data) ? data : undefined);
  if (source === undefined) {
    return [];
  }

  const canonicalId = state.canonicalIdFn(source);
  return canonicalId ? resourceIdentity.resolve(canonicalId) : [];
}
