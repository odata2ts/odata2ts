import {
  ODataCollectionResponseFor,
  ODataModelResponseFor,
  ODataValueResponseFor,
  ODataVersionV4,
} from "@odata2ts/odata-core";

/*
 * Responses are typed by the OData version the client targets, which the generator decides and passes on as a
 * type argument. It defaults to 4.0, so anything which does not state a version keeps the 4.0 spelling of the
 * control information.
 *
 * Where the version is genuinely unknown - hand-written clients, for instance - the flexible types from
 * odata-core cover both spellings in an either-or fashion.
 */

export type ValueModificationResponseV4<
  Response extends boolean,
  T,
  V extends ODataVersionV4 = "4.0",
> = Response extends true ? ODataValueResponseFor<V, T> : undefined;

export type EntityModificationResponseV4<
  Response extends boolean | undefined,
  T,
  V extends ODataVersionV4 = "4.0",
> = Response extends true ? ODataModelResponseFor<V, T> : undefined;

export type CollectionModificationResponseV4<
  Response extends boolean | undefined,
  T,
  V extends ODataVersionV4 = "4.0",
> = Response extends true ? ODataCollectionResponseFor<V, T> : undefined;
