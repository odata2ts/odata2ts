import { FilterClause, QFilterExpression } from "@odata2ts/odata-query-objects";

/**
 * An expand entry once its navigation property is known: the property's own OData name and kind - the same
 * `(name, kind)` shape a structured hop in the main key already uses, minus any key value (an expand target
 * is never addressed by a specific key, and a freshly deep-inserted entity has none of its own yet) - plus,
 * only when a nested `expanding()` builder ran for this property, that nested builder's own
 * `getCacheKeyParams()` output.
 *
 * That 3rd slot is not the same thing as a hierarchical hop's `<key>?` in the main key format: an expand
 * target is never addressed by an explicit key at all, so there is nothing that position could hold
 * instead, and the two never coexist.
 */
export type ExpandHop = readonly [name: string, kind: "list" | "detail", nestedParams?: CacheKeyParams];

/**
 * The restrictions a query puts on a resource, as a cache key carries them: one flat object, always the
 * last element of the key.
 *
 * Built from the query builder's own state rather than from the URL it produces - the structured values
 * exist one call frame up, and recovering them from a string would mean re-implementing OData's grammar.
 */
/**
 * A `type` alias rather than an `interface`, deliberately: an interface has no implicit index
 * signature and is therefore not assignable to `Record<string, unknown>`, which is what
 * `RequestCmdOptions.queryParams` takes. A type alias is.
 */
export type CacheKeyParams = {
  /** Structured filter map - see {@link foldFilterClauses}. */
  filter?: Record<string, unknown>;
  /** Rendered paths, sorted: their order carries no meaning. */
  select?: Array<string>;
  /** Rendered paths (bare) or hop-shaped entries where the target's own type is known, sorted by path. */
  expand?: Array<string | ExpandHop>;
  /** Rendered clauses, in source order: their order does carry meaning. */
  orderBy?: Array<string>;
  top?: number;
  skip?: number;
  /** Present only when `$count` / `$inlinecount` was actually requested. */
  count?: true;
  search?: string;
  /** Custom query options, nested so user-chosen names cannot collide with ours. */
  custom?: Record<string, unknown>;
  /** FQ type name of a subtype cast. */
  cast?: string;
  /** Singleton name. */
  singleton?: string;
  /** FQ operation name and its typed parameters. */
  operation?: string;
  params?: Record<string, unknown>;
};

/** `$` cannot occur in an OData identifier, so this can never collide with a property path. */
const RAW_KEY = "$raw";

/**
 * Folds every filter expression into one AND-map: a path maps to what is asserted about it.
 *
 * A single `eq` collapses to the bare value - the common case, and the form a derived relation produces,
 * which is what lets `/Media(5)/Copies` converge with a hand-written `$filter=MediumId eq 5`. Anything
 * else becomes `{<operator>: value}`, and several clauses on one path become an array in source order.
 * Whatever could not be decomposed at all is joined verbatim under `$raw`.
 */
export function foldFilterClauses(filters: ReadonlyArray<QFilterExpression>): Record<string, unknown> | undefined {
  const byPath = new Map<string, Array<FilterClause>>();
  const raw: Array<string> = [];

  for (const filter of filters) {
    for (const clause of filter.getClauses()) {
      const existing = byPath.get(clause.path);
      if (existing) {
        existing.push(clause);
      } else {
        byPath.set(clause.path, [clause]);
      }
    }
    raw.push(...filter.getRaw());
  }

  const result: Record<string, unknown> = {};
  for (const [path, clauses] of byPath) {
    result[path] =
      clauses.length === 1 ? renderSingle(clauses[0]) : clauses.map((clause) => ({ [clause.operator]: clause.value }));
  }
  if (raw.length) {
    result[RAW_KEY] = raw.join(" and ");
  }

  return Object.keys(result).length ? result : undefined;
}

function renderSingle(clause: FilterClause): unknown {
  return clause.operator === "eq" ? clause.value : { [clause.operator]: clause.value };
}

/**
 * Drops every empty entry, and the whole object where nothing is left. Key order inside it is irrelevant -
 * a cache hashes it order-independently, which is precisely why the filter is a map.
 */
export function normalizeCacheKeyParams(params: CacheKeyParams): CacheKeyParams | undefined {
  const result = Object.fromEntries(
    Object.entries(params).filter(([, value]) => {
      if (value === undefined || value === null) {
        return false;
      }
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (typeof value === "object") {
        return Object.keys(value).length > 0;
      }
      return true;
    }),
  );

  return Object.keys(result).length ? result : undefined;
}
