/**
 * An expand entry once its navigation property is known: the property's own OData name and kind - the same
 * `(name, kind)` shape a structured hop in the main key already uses. The optional 3rd slot, present only
 * when a nested `expanding()` builder ran for this property, carries *further* expand hops reachable
 * underneath it - nothing else. Identity for a nested query's own filter/select/orderBy/etc. is already
 * covered by the opaque `query` string `RequestCmd.cacheKey` attaches (see `QueryStringCapture.ts` in
 * odata-service); the only thing `touchesResource`/`buildDeepEditHops` ever read out of a nested expand
 * entry is more `(name, kind)` hops to keep recursing into.
 */
export type ExpandHop = readonly [name: string, kind: "list" | "detail", nested?: { expand?: Array<string | ExpandHop> }];

/**
 * The restrictions a query puts on a resource that need to stay structured for invalidation reach - not
 * the query's full identity, which `RequestCmd.cacheKey` captures separately as one opaque string (see
 * `QueryStringCapture.ts`). Only `$expand` (read by `touchesResource`/`buildDeepEditHops`) and `$select`
 * (kept for a currently-nonexistent future consumer) are structured at all; everything else - `$filter`,
 * `$orderBy`, `$top`, `$skip`, `$count`, `$search`, `$apply`, any custom query option - never had a reason
 * to be decomposed once nothing downstream ever inspected it.
 */
export type CacheKeyParams = {
  /** Rendered paths (bare) or hop-shaped entries where the target's own type is known, sorted by path. */
  expand?: Array<string | ExpandHop>;
  /** Rendered paths, sorted: their order carries no meaning. */
  select?: Array<string>;
};

/**
 * Drops every empty entry, and the whole object where nothing is left. Key order inside it is irrelevant -
 * a cache hashes it order-independently.
 */
export function normalizeCacheKeyParams(params: CacheKeyParams): CacheKeyParams | undefined {
  const result = Object.fromEntries(
    Object.entries(params).filter(([, value]) => Array.isArray(value) && value.length > 0),
  );

  return Object.keys(result).length ? result : undefined;
}
