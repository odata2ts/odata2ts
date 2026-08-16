import { EitherOr } from "../helper/EitherOr";
import { CollectionControlInfoV4, ModelControlInfoV4, ValueControlInfoV4 } from "./ResponseModelV4";
import { CollectionControlInfoV401, ModelControlInfoV401, ValueControlInfoV401 } from "./ResponseModelV401";

/*
 * Response types covering both spellings of the control information, but in an either-or fashion:
 * a response uses either the prefixed form of 4.0 ("@odata.count") or the short form of 4.01 ("@count"),
 * never a mix of both.
 *
 * Both are covered because the version of a response is decided by the service, not by the OData-Version header
 * we declare on requests, which only governs how the service interprets the request payload. Additionally,
 * payloads of 4.01 or greater merely SHOULD NOT use the prefix, they are not forbidden from doing so.
 *
 * See https://docs.oasis-open.org/odata/odata-json-format/v4.01/odata-json-format-v4.01.html#sec_ControlInformation
 */

/**
 * Response to a collection query, with either the prefixed or the short form of the control information.
 */
export type FlexibleODataCollectionResponseV4<T> = {
  /**
   * The requested collection value.
   */
  value: Array<T>;
} & EitherOr<CollectionControlInfoV4, CollectionControlInfoV401>;

/**
 * Response to query for an EntityType or ComplexType, with either the prefixed or the short form
 * of the control information.
 */
export type FlexibleODataModelResponseV4<T> = T & EitherOr<ModelControlInfoV4, ModelControlInfoV401>;

/**
 * Response to a value query on a property, with either the prefixed or the short form of the control information.
 */
export type FlexibleODataValueResponseV4<T> = { value: T } & EitherOr<ValueControlInfoV4, ValueControlInfoV401>;
