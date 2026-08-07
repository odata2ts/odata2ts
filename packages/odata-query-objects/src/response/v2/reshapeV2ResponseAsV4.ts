import { toV4ControlInfo } from "./toV4ControlInfo";

function isDeferred(value: any): boolean {
  return !!value && typeof value === "object" && !Array.isArray(value) && "__deferred" in value;
}

function isResultsWrapped(value: any): value is { results: Array<any> } {
  return !!value && typeof value === "object" && !Array.isArray(value) && Array.isArray(value.results);
}

/**
 * Reshapes an already type-/name-converted V2 payload (as produced by {@link QueryObjectModel.convertFromOData})
 * into the structure a V4 payload would have:
 * - `__metadata` (uri, type, etag) is turned into `@odata.id` / `@odata.type` / `@odata.etag`, see
 *   {@link toV4ControlInfo}.
 * - A collection-valued navigation property wrapped as `{ results: [...] }` (see issue #237) becomes a plain
 *   array, as V4 has no equivalent wrapping.
 * - A deferred navigation property (`{ __deferred: { uri } }`) is dropped entirely, since V4 simply omits any
 *   navigation property that hasn't been expanded, rather than stating a placeholder for it.
 *
 * Applies recursively, so that navigation properties expanded to any depth are reshaped the same way as the
 * top-level entity or collection.
 */
export function reshapeV2ResponseAsV4(value: any): any {
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(reshapeV2ResponseAsV4);
  }
  if (isDeferred(value)) {
    return undefined;
  }
  if (isResultsWrapped(value)) {
    return value.results.map(reshapeV2ResponseAsV4);
  }

  const { __metadata, ...ownProps } = value;
  const result: Record<string, any> = __metadata ? toV4ControlInfo(__metadata) : {};

  for (const [key, propValue] of Object.entries(ownProps)) {
    const reshaped = reshapeV2ResponseAsV4(propValue);
    // a dropped deferred nav prop yields undefined here, while a genuinely undefined/null value should stay
    if (reshaped !== undefined || propValue === undefined || propValue === null) {
      result[key] = reshaped;
    }
  }

  return result;
}
