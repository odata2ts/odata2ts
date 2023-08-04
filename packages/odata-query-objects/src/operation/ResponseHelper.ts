import { HttpResponseModel } from "@odata2ts/http-client-api";
import {
  ODataCollectionResponseV2,
  ODataCollectionResponseV4,
  ODataModelResponseV2,
  ODataModelResponseV4,
  ODataValueResponseV2,
  ODataValueResponseV4,
} from "@odata2ts/odata-core";

import { QParamModel } from "../param/QParamModel";

export interface Convertible extends Pick<QParamModel<any, any>, "convertFrom" | "convertTo"> {}
export type ConvertibleV2 = Convertible & Pick<QParamModel<any, any>, "getName" | "getMappedName">;

export type ResponseConverter = (
  response: HttpResponseModel<any>,
  qResponseType: Convertible
) => HttpResponseModel<any>;

export type ResponseConverterV2 = (
  response: HttpResponseModel<any>,
  qResponseType: ConvertibleV2
) => HttpResponseModel<any>;

/*
/!**
 * Spec and real implementations of OData V2 differ in some points regarding the response types:
 * - spec about primitive props as return type: "d.results"; real world uses only "d" (same as V1)
 * - spec about complex types as return type: "d.results"; real world uses only "d" (same as V1 & V2 models)
 * - spec about primitive collections as return type: "d: []"; real world "d.results: []" (same as V2 collections)
 *
 * With this helper function we try to use the "results" object, if it exists, otherwise we fall back to just
 * using object "d" itself. This way we support both semantics.
 *
 * @see https://www.odata.org/documentation/odata-version-2-0/json-format/
 * @param responseData
 *!/
function getValueForV2OrV1ResponseModels(responseData: ODataValueResponseV2<any>) {
  return typeof responseData.d?.results === "object" &&
    Object.keys(responseData.d).filter((d) => !d.startsWith("__")).length === 1
    ? responseData.d.results
    : responseData.d;
}
*/

export const convertV2ValueResponse: ResponseConverterV2 = (response, qResponseType) => {
  const asV2Model = response.data as ODataValueResponseV2<any>;
  const value = asV2Model?.d;
  if (typeof value === "object") {
    // we try to match by known attribute name
    if (value.hasOwnProperty(qResponseType.getName())) {
      // map attribute name and convert the attribute value
      asV2Model.d = { [qResponseType.getMappedName()]: qResponseType.convertFrom(value[qResponseType.getName()]) };
    }
    // alternatively, if single attribute is given, then we use that one
    else {
      const keyValue = Object.entries(value);
      if (keyValue.length === 1) {
        const [key, val] = keyValue[0];
        // convert value only
        asV2Model.d[key] = qResponseType.convertFrom(val);
      }
    }
  }

  return response;
};

export const convertV2ModelResponse: ResponseConverter = (response, qResponseType) => {
  const asV2Model = response.data as ODataModelResponseV2<any>;
  if (asV2Model?.d && typeof asV2Model.d === "object") {
    asV2Model.d = qResponseType.convertFrom(asV2Model.d);
  }

  return response;
};

export const convertV2CollectionResponse: ResponseConverter = (response, qResponseType) => {
  const asV2Collection = response.data as ODataCollectionResponseV2<any>;
  const value = asV2Collection?.d?.results;
  if (value && typeof value === "object") {
    asV2Collection.d.results = qResponseType.convertFrom(value);
  }
  // support for V1
  else if (asV2Collection?.d && typeof asV2Collection.d === "object") {
    asV2Collection.d = qResponseType.convertFrom(asV2Collection.d);
  }

  return response;
};

export const convertV4ValueResponse: ResponseConverter = (response, qResponseType) => {
  const asV4Value = response.data?.value as ODataValueResponseV4<any>;
  if (response.status === 204) {
    response.data = { value: null };
  } else if (asV4Value !== undefined && asV4Value !== null) {
    response.data.value = qResponseType.convertFrom(asV4Value);
  }
  return response;
};

export const convertV4ModelResponse: ResponseConverter = (response, qResponseType) => {
  const asV4Model = response.data as ODataModelResponseV4<any>;
  if (asV4Model && typeof asV4Model === "object") {
    response.data = qResponseType.convertFrom(asV4Model);
  }
  return response;
};

export const convertV4CollectionResponse: ResponseConverter = (response, qResponseType) => {
  const asV4Collection = response.data as ODataCollectionResponseV4<any>;
  const value = asV4Collection?.value;
  if (value && typeof value === "object") {
    asV4Collection.value = qResponseType.convertFrom(value);
  }

  return response;
};
