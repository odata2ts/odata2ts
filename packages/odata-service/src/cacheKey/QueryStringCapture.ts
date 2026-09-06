import { ODataHttpMethods } from "@odata2ts/http-client-api";
import { GET_AS_POST_URL_SUFFIX } from "../request/RequestHelper.js";

/**
 * The request's own rendered query string, captured verbatim - never decomposed back into semantic pieces,
 * just stored and compared as one opaque value, the same way an undecomposable filter already becomes a
 * `$raw` fragment. This is what makes cache-key identity complete for every query feature, present and
 * future, without a second, hand-maintained snapshot that has to be kept in sync with what `build()`
 * actually renders (see `docs/superpowers/specs/2026-09-05-cache-key-query-params-redesign.md` for the
 * `$apply`/`groupBy` drift this replaces).
 *
 * `GetToPostConverter` (`RequestHelper.ts`) relocates a GET's query string into the POST body verbatim when
 * the URL would otherwise be too long, appending the literal `/$query` suffix to the URL. Reaching this
 * function at all already implies the request started as a `GET` (`RequestCmd.cacheKey` is `undefined` for
 * any other method), so a final, post-conversion state that is a `POST` whose URL ends in that suffix
 * unambiguously means the converter ran - no other converter in the codebase relocates a query string this
 * way. In that case the query string is read from `data` (the body) instead of the URL, since the URL no
 * longer carries it.
 */
export function captureQueryString(method: ODataHttpMethods, url: string, data: unknown): string | undefined {
  if (method === ODataHttpMethods.Post && url.endsWith(GET_AS_POST_URL_SUFFIX)) {
    return typeof data === "string" && data.length ? data : undefined;
  }

  const queryIndex = url.indexOf("?");
  return queryIndex === -1 ? undefined : url.slice(queryIndex + 1);
}

/**
 * `$select`/`$expand` already live as their own structured params-object entries
 * (`ODataQueryBuilder.getCacheKeyParams()`), and `$filter`/`$search` now do too, rendered canonically there
 * (sorted, `$filter` also safely grouped - see `CacheKeyParams.ts` in odata-query-builder). Carrying any of
 * the four here as well would be dead duplication, not a missed identity signal - so they are dropped from
 * this opaque string entirely, never re-derived from it.
 */
const STRUCTURED_QUERY_OPTIONS = ["$select", "$expand", "$filter", "$search"];

/**
 * Canonicalizes whatever `captureQueryString` returned, so two requests differing only in *which order*
 * their query options happen to appear in - a hand-built URL, a manually appended custom param, or
 * `GetToPostConverter`'s relocated body - still converge on the same cache key. Only the top-level
 * `key=value` pair sequence is touched (ordinary URL syntax, via `URLSearchParams`, never OData grammar):
 * pairs are sorted by key, same-key duplicates keep their original relative order (`URLSearchParams.sort()`
 * is a stable sort), and nothing inside any one value is ever inspected or rewritten.
 *
 * `$orderBy`, `$top`, `$skip`, `$count`, `$apply`, and any custom option all stay - untouched, opaque,
 * exactly the way `$orderBy`'s own sequence has to (see `CacheKeyParams.ts`). Only `$select`/`$expand`/
 * `$filter`/`$search` are removed, since all four are now captured structurally elsewhere (see above).
 *
 * Returns `undefined` where nothing is left, mirroring "empty entries are dropped" for the rest of the
 * params object.
 */
export function canonicalizeQueryString(query: string): string | undefined {
  const params = new URLSearchParams(query);
  for (const option of STRUCTURED_QUERY_OPTIONS) {
    params.delete(option);
  }
  params.sort();

  const canonical = params.toString();
  return canonical.length ? canonical : undefined;
}
