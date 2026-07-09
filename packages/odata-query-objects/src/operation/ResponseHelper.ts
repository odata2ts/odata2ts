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

/**
 * The main ResponseDataConverter interface, which allows to convert from the OData model to the user model.
 */
export type ResponseDataConverter<OriginalType = any, ConvertedType = any> = Pick<
  QParamModel<OriginalType, ConvertedType>,
  "convertFrom"
>;

/**
 * OData V2 responds to value queries with a partial entity model only consisting of the given property.
 * Hence, we need a special value converter for V2 which can also map the property name.
 *
 * However, to reduce complexity we hide this fact and publicly use the ResponseConverter interface,
 * while the corresponding converter and adapter implement this prop name mapping feature.
 */
export type ResponseValueConverterV2 = ResponseDataConverter &
  Partial<Pick<QParamModel<any, any>, "getName" | "getMappedName">>;

export type ResponseDataAdapter = (
  response: HttpResponseModel<any>,
  converters: ResponseDataConverter,
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

export const convertV2ValueResponse: ResponseDataAdapter = (response, conv) => {
  const asV2Model = response.data as ODataValueResponseV2<any>;
  const value = asV2Model?.d;
  if (typeof value === "object") {
    const converter = conv as ResponseValueConverterV2;
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
  }

  return response;
};

export const convertV2ComplexModelResponse: ResponseDataAdapter = (response, converter) => {
  const asV2Model = response.data as ODataComplexModelResponseV2<any>;
  if (typeof asV2Model?.d === "object") {
    const values = Object.values(asV2Model.d);
    if (values.length === 1 && typeof values[0] === "object") {
      asV2Model.d = converter.convertFrom(values[0]);
    }
  }

  return response;
};

export const convertV2EntityModelResponse: ResponseDataAdapter = (response, converter) => {
  const asV2Model = response.data as ODataEntityModelResponseV2<any>;
  if (asV2Model?.d && typeof asV2Model.d === "object") {
    asV2Model.d = converter.convertFrom(asV2Model.d);
  }

  return response;
};

export const convertV2CollectionResponse: ResponseDataAdapter = (response, converter) => {
  const asV2Collection = response.data as ODataCollectionResponseV2<any>;
  const value = asV2Collection?.d?.results;
  if (value && typeof value === "object") {
    asV2Collection.d.results = converter.convertFrom(value);
  }
  // support for V1
  else if (asV2Collection?.d && typeof asV2Collection.d === "object") {
    asV2Collection.d = converter.convertFrom(asV2Collection.d);
  }

  return response;
};

export const convertV4ValueResponse: ResponseDataAdapter = (response, converter) => {
  const asV4Value = response.data?.value as ODataValueResponseV4<any>;
  if (response.status === 204) {
    response.data = { value: null };
  } else if (asV4Value !== undefined && asV4Value !== null) {
    response.data.value = converter.convertFrom(asV4Value);
  }
  return response;
};

export const convertV4ModelResponse: ResponseDataAdapter = (response, converter) => {
  const asV4Model = response.data as ODataModelResponseV4<any>;
  if (asV4Model && typeof asV4Model === "object") {
    response.data = converter.convertFrom(asV4Model);
  }
  return response;
};

export const convertV4CollectionResponse: ResponseDataAdapter = (response, converter) => {
  const asV4Collection = response.data as ODataCollectionResponseV4<any>;
  const value = asV4Collection?.value;
  if (value && typeof value === "object") {
    asV4Collection.value = converter.convertFrom(value);
  }

  return response;
};

export enum ReturnTypes {
  VOID,
  VALUE,
  COLLECTION,
  ENTITY,
  COMPLEX,
}

export function getResponseDataAdapter(returnType: ReturnTypes): ResponseDataAdapter | undefined {
  switch (returnType) {
    case ReturnTypes.VALUE:
      return convertV4ValueResponse;
    case ReturnTypes.ENTITY:
    case ReturnTypes.COMPLEX:
      return convertV4ModelResponse;
    case ReturnTypes.COLLECTION:
      return convertV4CollectionResponse;
    default:
      return undefined;
  }
}

export function getResponseDataAdapterV2(returnType: ReturnTypes): ResponseDataAdapter | undefined {
  switch (returnType) {
    case ReturnTypes.VALUE:
      return convertV2ValueResponse;
    case ReturnTypes.COMPLEX:
      return convertV2ComplexModelResponse;
    case ReturnTypes.ENTITY:
      return convertV2EntityModelResponse;
    case ReturnTypes.COLLECTION:
      return convertV2CollectionResponse;
    default:
      return undefined;
  }
}
