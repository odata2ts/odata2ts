import { HttpResponseModel } from "@odata2ts/http-client-api";

/**
 * What a generated service answers with: the HTTP client's response model plus what odata2ts knows on top
 * of it.
 *
 * Defined here rather than in `http-client-api`: an HTTP client has no business knowing about cache keys.
 */
export interface ODataResponseModel<T> extends HttpResponseModel<T> {
  /**
   * The keys this write makes stale. Absent on reads - the key a read should be stored under is
   * {@link RequestCmd.cacheKey}, available before the request goes out.
   *
   * **For an action this is a lower bound, not a statement.** OData has no way to declare what an action
   * changes, so an action contributes the same entries as any other write on its bound resource and
   * nothing more.
   */
  readonly invalidates?: ReadonlyArray<ReadonlyArray<unknown>>;
}
