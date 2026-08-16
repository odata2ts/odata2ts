import { ODataVersionV4 } from "../ODataVersions";
import { ODataCollectionResponseV4, ODataModelResponseV4, ODataValueResponseV4 } from "./ResponseModelV4";
import { ODataCollectionResponseV401, ODataModelResponseV401, ODataValueResponseV401 } from "./ResponseModelV401";

/*
 * Selects the response types by the OData version which is targeted, so that a generated client only sees
 * the spelling of the control information its service actually uses.
 *
 * The flexible types remain the right choice wherever the version is genuinely unknown, e.g. for hand-written
 * clients: see FlexibleResponseModelV4.
 */

/**
 * Response to query for an EntityType or ComplexType, in the spelling of the targeted OData version.
 */
export type ODataModelResponseFor<V extends ODataVersionV4, T> = V extends "4.01"
  ? ODataModelResponseV401<T>
  : ODataModelResponseV4<T>;

/**
 * Response to a collection query, in the spelling of the targeted OData version.
 */
export type ODataCollectionResponseFor<V extends ODataVersionV4, T> = V extends "4.01"
  ? ODataCollectionResponseV401<T>
  : ODataCollectionResponseV4<T>;

/**
 * Response to a value query on a property, in the spelling of the targeted OData version.
 */
export type ODataValueResponseFor<V extends ODataVersionV4, T> = V extends "4.01"
  ? ODataValueResponseV401<T>
  : ODataValueResponseV4<T>;
