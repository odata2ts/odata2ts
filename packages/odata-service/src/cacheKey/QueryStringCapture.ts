import { ODataHttpMethods } from "@odata2ts/http-client-api";
import { GET_AS_POST_URL_SUFFIX } from "../request/RequestHelper.js";

/**
 * The request's own rendered query string, captured verbatim - never decomposed back into semantic pieces,
 * just stored and compared as one opaque value, the same way an undecomposable filter already becomes a
 * `$raw` fragment. This is what makes cache-key identity complete for every query feature, present and
 * future, without a second, hand-maintained snapshot that has to be kept in sync with what `build()`
 * actually renders (the `$apply`/`groupBy` drift this replaces is pinned by the `CacheKeys.test.ts`
 * regression tests in `int-test/asp-net` and `int-test/cap`).
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
 * `$select` is dropped from the opaque string entirely: its own structured params-object entry (a sorted
 * array, `ODataQueryBuilder.getCacheKeyParams()`) already carries its **complete** restriction, so keeping
 * the raw text here too would be dead duplication, never a missed identity signal.
 *
 * `$filter`/`$search` are *not* dropped, and never get a structured entry of their own either - they stay
 * right here, in this same opaque string, just with their own raw text replaced by the canonical rendering
 * `getCacheKeyParams()` computes (sorted by clause, `$filter` also safely grouped - see `CacheKeyParams.ts`),
 * so that `.filter(a).filter(b)` and `.filter(b).filter(a)` converge without needing a second, separate key.
 *
 * `$expand` is deliberately **not** touched at all, even though it also gets a structured entry. That entry
 * is narrower than its full text on purpose - it carries only `(name, kind)` hops, never a nested query's
 * own `$filter`/`$select`/`$orderBy` (`CacheKeyParams.ts`'s `expand` doc comment). `$expand=Copies` and
 * `$expand=Copies($filter=Condition eq 3)` both structurally enrich to the identical `[["Copies","list"]]`
 * hop - so if `$expand`'s own text were also stripped from the opaque string, two requests that restrict a
 * nested collection differently would collapse onto the same cache key, a real identity violation, not
 * just weaker convergence. Keeping `$expand`'s full text here is what still tells them apart; the resulting
 * duplication for a *bare* `$expand` (no nested restriction) is accepted as harmless, exactly as it always
 * was for `$expand`/`$select` before this canonicalization existed at all.
 */
const STRIPPED_QUERY_OPTIONS = ["$select", "$filter", "$search"];

/**
 * Canonicalizes whatever `captureQueryString` returned, so two requests differing only in *which order*
 * their query options happen to appear in - a hand-built URL, a manually appended custom param, or
 * `GetToPostConverter`'s relocated body - still converge on the same cache key, and so that
 * `.filter(a).filter(b)`/`.filter(b).filter(a)` (same for `.search()`) converge too.
 *
 * `filter`/`search` are the canonical strings `ODataQueryBuilder.getCacheKeyParams()` computed for this same
 * request (`undefined` where the query had none) - they replace whatever raw `$filter=`/`$search=` text was
 * in `query`, rather than sitting next to it. Only the top-level `key=value` pair sequence is otherwise
 * touched (ordinary URL syntax, via `URLSearchParams`, never OData grammar): pairs are sorted by key,
 * same-key duplicates keep their original relative order (`URLSearchParams.sort()` is a stable sort), and
 * nothing inside any one value is ever inspected or rewritten beyond this one substitution.
 *
 * `$expand`, `$orderBy`, `$top`, `$skip`, `$count`, `$apply`, and any custom option all stay - untouched,
 * opaque, sharing this one string with the now-canonical `$filter`/`$search`. `$orderBy` stays because its
 * own sequence is real, result-changing content (see `CacheKeyParams.ts`); `$expand` stays for the reason
 * above. Only `$select` is ever fully removed with nothing put back, since nothing downstream needs its raw
 * text once its own structured entry exists.
 *
 * Returns `undefined` where nothing is left, mirroring "empty entries are dropped" for the rest of the
 * params object.
 */
export function canonicalizeQueryString(query: string, filter?: string, search?: string): string | undefined {
  const params = new URLSearchParams(query);
  for (const option of STRIPPED_QUERY_OPTIONS) {
    params.delete(option);
  }
  if (filter) {
    params.set("$filter", filter);
  }
  if (search) {
    params.set("$search", search);
  }
  params.sort();

  const canonical = params.toString();
  return canonical.length ? canonical : undefined;
}
