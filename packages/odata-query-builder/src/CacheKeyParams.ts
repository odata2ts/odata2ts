/**
 * An expand entry once its navigation property is known: the property's own OData name and kind - the same
 * `(name, kind)` shape a structured hop in the main key already uses. The optional 3rd slot, present only
 * when a nested `expanding()` builder ran for this property, carries *further* expand hops reachable
 * underneath it - nothing else. Identity for a nested query's own filter/select/orderBy/etc. is already
 * covered by the opaque `query` string `RequestCmd.cacheKey` attaches (see `QueryStringCapture.ts` in
 * odata-service); the only thing `touchesResource`/`buildDeepEditHops` ever read out of a nested expand
 * entry is more `(name, kind)` hops to keep recursing into.
 */
export type ExpandHop = readonly [
  name: string,
  kind: "list" | "detail",
  nested?: { expand?: Array<string | ExpandHop> },
];

/**
 * The restrictions a query puts on a resource that need to stay structured, either for invalidation reach
 * or so their identity can converge regardless of call-site ordering - not the query's full identity,
 * which `RequestCmd.cacheKey` captures separately as one opaque string for everything else (see
 * `QueryStringCapture.ts`). `$expand` (read by `touchesResource`/`buildDeepEditHops`), `$select` (kept for
 * a currently-nonexistent future consumer), `$filter` and `$search` (see below) are structured; everything
 * else - `$orderBy`, `$top`, `$skip`, `$count`, `$apply`, any custom query option - never had a reason to
 * be decomposed once nothing downstream ever inspected it. `$orderBy` in particular is deliberately left
 * out here: its own sequence changes the actual result (sort priority), so - unlike `$filter`/`$search`,
 * whose multiple call-site clauses combine commutatively - it must never be reordered for convergence, and
 * stays exactly as rendered inside the opaque string instead.
 */
export type CacheKeyParams = {
  /** Rendered paths (bare) or hop-shaped entries where the target's own type is known, sorted by path. */
  expand?: Array<string | ExpandHop>;
  /** Rendered paths, sorted: their order carries no meaning. */
  select?: Array<string>;
  /**
   * Every top-level `.filter()` call's own clause is combined by plain, unparenthesized concatenation
   * (`QFilterExpression.combine`) - so `.filter(a).filter(b)` and `.filter(b).filter(a)` render different
   * text for what is otherwise the same restriction. This is that same set of clauses instead rendered
   * canonically: sorted by their own text, each wrapped in `.group()` **only when there are 2+** (so a
   * lone `.filter(x)` stays bare, matching what `build()` itself renders for that common case), then
   * joined with `"and"`. Grouping is required for correctness, not just style: without it, a clause
   * containing an ungrouped `.or()` changes *meaning* depending on which neighbor ends up adjacent to it
   * after sorting (e.g. `"R and P or Q"` reads as `(R and P) or Q`, `"P or Q and R"` as `P or (Q and R)`) -
   * two different real queries could otherwise canonicalize to the identical string. Never affects what
   * `build()` itself renders or what the server receives - this exists solely for the cache key.
   */
  filter?: string;
  /**
   * The same idea as `filter`, for `.search()` calls - sorted by each term's own rendered text, then
   * joined with `"AND"`. No grouping needed here: `QSearchTerm.or()` already self-parenthesizes every
   * compound it builds, and the top-level join between separate `.search()` calls is always `"AND"`
   * (never `"OR"`), so there is no position-dependent ambiguity for grouping to guard against.
   */
  search?: string;
};

/**
 * Drops every empty entry, and the whole object where nothing is left. Key order inside it is irrelevant -
 * a cache hashes it order-independently.
 */
export function normalizeCacheKeyParams(params: CacheKeyParams): CacheKeyParams | undefined {
  const result = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => (Array.isArray(value) && value.length > 0) || (typeof value === "string" && value.length > 0),
    ),
  );

  return Object.keys(result).length ? result : undefined;
}
