import { ODataVersionV4 } from "../ODataVersions";
import { ODataModelPayloadV4 } from "./ODataModelPayloadV4";
import { ODataModelPayloadV401 } from "./ODataModelPayloadV401";

/*
 * Selects the request payload by the OData version which is targeted. In contrast to responses we do control
 * which form is sent, so exactly one spelling of the control information is valid - the one belonging to the
 * declared version.
 *
 * The flexible payload from FlexibleModelPayloadV4 remains the right choice wherever the version is unknown.
 */

/**
 * Request payload for an EntityType or ComplexType, in the spelling of the targeted OData version.
 */
export type ODataModelPayloadFor<V extends ODataVersionV4, T> = V extends "4.01"
  ? ODataModelPayloadV401<T>
  : ODataModelPayloadV4<T>;
