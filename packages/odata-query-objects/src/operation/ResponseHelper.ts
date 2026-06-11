import { HttpResponseModel } from "@odata2ts/http-client-api";
import {
  ODataCollectionResponseV2,
  ODataCollectionResponseV4,
  ODataComplexModelResponseV2,
  ODataEntityModelResponseV2,
  ODataModelResponseV4,
  ODataValueResponseV2,
  ODataValueResponseV4,
} from "@odata2ts/odata-core";
import { QParamModel } from "../param/QParamModel";

export interface ResponseConverter extends Pick<QParamModel<any, any>, "convertFrom"> {}
export type ResponseConverterV2 = ResponseConverter & Partial<Pick<QParamModel<any, any>, "getName" | "getMappedName">>;

export type ResponseAdapter = (
  response: HttpResponseModel<any>,
  converters: Array<ResponseConverter>,
) => HttpResponseModel<any>;

export type ResponseAdapterV2 = (
  response: HttpResponseModel<any>,
  converters: Array<ResponseConverterV2>,
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

export const convertV2ValueResponse: ResponseAdapterV2 = (response, converters) => {
  const asV2Model = response.data as ODataValueResponseV2<any>;
  const value = asV2Model?.d;
  if (typeof value === "object") {
    converters.forEach((converter) => {
      // we try to match by known attribute name
      const name = typeof converter.getName === "function" ? converter.getName() : undefined;
      const mappedName = typeof converter.getMappedName === "function" ? converter.getMappedName() : name;
      if (name && mappedName && value.hasOwnProperty(name)) {
        // map attribute name and convert the attribute value
        asV2Model.d = { [mappedName]: converter.convertFrom(value[name]) };
      }
      // alternatively, if single attribute is given, then we use that one
      else {
        const keyValue = Object.entries(value);
        if (keyValue.length === 1) {
          const [key, val] = keyValue[0];
          // convert value only
          asV2Model.d[key] = converter.convertFrom(val);
        }
      }
    }, value);
  }

  return response;
};

export const convertV2ComplexModelResponse: ResponseAdapter = (response, converters) => {
  const asV2Model = response.data as ODataComplexModelResponseV2<any>;
  if (typeof asV2Model?.d === "object") {
    const values = Object.values(asV2Model.d);
    if (values.length === 1 && typeof values[0] === "object") {
      asV2Model.d = applyConverters(values[0], converters);
    }
  }

  return response;
};

export const convertV2EntityModelResponse: ResponseAdapter = (response, converters) => {
  const asV2Model = response.data as ODataEntityModelResponseV2<any>;
  if (asV2Model?.d && typeof asV2Model.d === "object") {
    asV2Model.d = applyConverters(asV2Model.d, converters);
  }

  return response;
};

export const convertV2CollectionResponse: ResponseAdapter = (response, converters) => {
  const asV2Collection = response.data as ODataCollectionResponseV2<any>;
  const value = asV2Collection?.d?.results;
  if (value && typeof value === "object") {
    asV2Collection.d.results = applyConverters(value, converters);
  }
  // support for V1
  else if (asV2Collection?.d && typeof asV2Collection.d === "object") {
    asV2Collection.d = applyConverters(asV2Collection.d, converters);
  }

  return response;
};

export const convertV4ValueResponse: ResponseAdapter = (response, converters) => {
  const asV4Value = response.data?.value as ODataValueResponseV4<any>;
  if (response.status === 204) {
    response.data = { value: null };
  } else if (asV4Value !== undefined && asV4Value !== null) {
    response.data.value = applyConverters(asV4Value, converters);
  }
  return response;
};

export const convertV4ModelResponse: ResponseAdapter = (response, converters) => {
  const asV4Model = response.data as ODataModelResponseV4<any>;
  if (asV4Model && typeof asV4Model === "object") {
    response.data = applyConverters(asV4Model, converters);
  }
  return response;
};

export const convertV4CollectionResponse: ResponseAdapter = (response, converters) => {
  const asV4Collection = response.data as ODataCollectionResponseV4<any>;
  const value = asV4Collection?.value;
  if (value && typeof value === "object" && converters.length) {
    asV4Collection.value = applyConverters(value, converters);
  }

  return response;
};

const applyConverters = <T>(value: T, converters: Array<ResponseConverter>) => {
  return converters.reduce((result, converter) => {
    return converter.convertFrom(result);
  }, value);
};
