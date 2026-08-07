import { ComplexMetaModelV2, EntityMetaModelV2, ModelControlInfoV4 } from "@odata2ts/odata-core";

/**
 * Maps V2's `__metadata` (uri, type, etag) onto the closest V4 control information, so that a V2 response
 * reshaped as V4 carries the same information under the names a V4 consumer expects.
 */
export function toV4ControlInfo(metadata: EntityMetaModelV2 | ComplexMetaModelV2): ModelControlInfoV4 {
  const { uri, type, etag } = metadata as EntityMetaModelV2;
  const result: ModelControlInfoV4 = {};

  if (uri) {
    result["@odata.id"] = uri;
  }
  if (type) {
    result["@odata.type"] = type;
  }
  if (etag) {
    result["@odata.etag"] = etag;
  }

  return result;
}
