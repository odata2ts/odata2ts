import { EitherOr } from "../helper/EitherOr";
import { ModelPayloadControlInfoV4 } from "./ODataModelPayloadV4";
import { ModelPayloadControlInfoV401 } from "./ODataModelPayloadV401";

/*
 * Request payload covering both spellings of the control information, but in an either-or fashion:
 * a payload uses either the prefixed form of 4.0 ("@odata.type") or the short form of 4.01 ("@type"),
 * never a mix of both.
 *
 * In contrast to the response types, we do control which form we send here - the OData version we declare
 * decides it. The version is a runtime option though, so it cannot narrow the type at compile time; covering
 * both keeps the declared type honest and lets consumers supply either form themselves.
 *
 * See https://docs.oasis-open.org/odata/odata-json-format/v4.01/odata-json-format-v4.01.html#sec_ControlInformation
 */

/**
 * Request payload for an EntityType or ComplexType, with either the prefixed or the short form
 * of the control information.
 */
export type FlexibleODataModelPayloadV4<T> = Omit<
  T,
  keyof ModelPayloadControlInfoV4 | keyof ModelPayloadControlInfoV401
> &
  EitherOr<ModelPayloadControlInfoV4, ModelPayloadControlInfoV401>;
