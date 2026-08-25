import { ODataClientError } from "@odata2ts/http-client-api";

/**
 * A write to a resource under optimistic concurrency control, for which no ETag is known.
 *
 * Thrown before the request is sent: the service would answer `428 Precondition Required` and change
 * nothing (OData V4.01 Part 1, §11.4.1.1), so the round trip has nothing to offer.
 */
export class ODataConcurrencyError extends Error {
  public constructor(public readonly resource: string) {
    super(
      `No ETag is known for [${resource}], but the service requires one to modify it. ` +
        `Read the resource first, or state the ETag yourself with withETag("..."), ` +
        `or write regardless with ignoreETag().`,
    );
    this.name = this.constructor.name;
  }
}

function hasStatus(error: unknown, status: number): boolean {
  return typeof error === "object" && error !== null && (error as ODataClientError).status === status;
}

/**
 * Whether a failed request failed because the resource had changed since its ETag was read - the conflict
 * optimistic concurrency control exists to surface.
 *
 * Resolving it is the application's business: re-read, merge, write again. odata2ts reports the conflict
 * and does nothing clever about it.
 */
export function isConcurrencyConflict(error: unknown): boolean {
  return hasStatus(error, 412);
}

/**
 * Whether the service demanded an ETag which was not sent.
 *
 * With a service that annotates itself this should not happen - odata2ts would have thrown an
 * {@link ODataConcurrencyError} before sending anything. Reaching this means the service requires
 * optimistic concurrency control without announcing it, which is the one case odata2ts cannot detect on
 * its own, so the guard earns its place as a diagnostic.
 */
export function isConcurrencyRequired(error: unknown): boolean {
  return hasStatus(error, 428);
}
