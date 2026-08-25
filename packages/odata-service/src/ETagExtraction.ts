/**
 * The ETag a V4 response body states for an entity, in whichever spelling it used.
 *
 * OData 4.0 writes the control information as `@odata.etag`, 4.01 shortens it to `@etag` - see
 * `ResponseModelV4` and `ResponseModelV401`, which type them respectively. Both are read, because the
 * version a client was generated for says nothing about the version the service answers in. The prefixed
 * form wins where a payload somehow carries both, being the more specific spelling.
 */
export function getBodyETagV4(entry: any): string | undefined {
  return entry?.["@odata.etag"] ?? entry?.["@etag"];
}

/**
 * The ETag a V2 response body states for an entity: `__metadata.etag`.
 *
 * Kept apart from {@link getBodyETagV4} on purpose. One function trying every spelling would work, and
 * would blur two payload formats that have nothing else in common - a V2 service reads V2 responses. The
 * single exception belongs to the caller rather than here: a V2 service configured with `v2ResponseAsV4`
 * has had its response reshaped into V4 form before a harvest runs, so it reaches for the V4 reader.
 */
export function getBodyETagV2(entry: any): string | undefined {
  return entry?.__metadata?.etag;
}

/**
 * The ETag of the `ETag` response header, which is version-independent.
 *
 * Header names arrive lower-cased from every odata2ts HTTP client, but the original casing is accepted as
 * well, since a custom client is free to hand them over exactly as the server spelled them.
 */
export function getHeaderETag(headers?: Record<string, string>): string | undefined {
  return headers?.["etag"] ?? headers?.["ETag"];
}
