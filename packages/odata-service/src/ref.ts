/**
 * The request-reference token `$<id>` for a batch sub-request's wire id - the form a later sub-request
 * uses to point at an earlier one (or its own response, via the factory form's `selfRef`).
 *
 * It is for the reference sites the batch builder cannot reach on the caller's behalf: the unquoted value
 * of an `If-Match` / `If-None-Match` header (an ETag reference) and a value in a body or query (a value
 * reference). The builder sees the `dependsOn` it is handed but not this token, so whether a reference
 * actually resolves is the server's call - the client sends it verbatim and the service resolves it.
 *
 * @param id the wire id the reference names, as the batch builder assigned it
 */
export function ref(id: number): string {
  return `$${id}`;
}
