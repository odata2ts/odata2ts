import { HttpResponseModel } from "@odata2ts/http-client-api";

import { QParamModel } from "../param/QParamModel";
import {
  ResponseConverter,
  ResponseConverterV2,
  convertV2CollectionResponse,
  convertV2ModelResponse,
  convertV2ValueResponse,
  convertV4CollectionResponse,
  convertV4ModelResponse,
  convertV4ValueResponse,
} from "./ResponseHelper";

export enum ReturnTypes {
  VOID,
  VALUE,
  VALUE_COLLECTION,
  COMPLEX,
  COMPLEX_COLLECTION,
}

function getResponseConverter(returnType: ReturnTypes): ResponseConverter | undefined {
  switch (returnType) {
    case ReturnTypes.VALUE:
      return convertV4ValueResponse;
    case ReturnTypes.COMPLEX:
      return convertV4ModelResponse;
    case ReturnTypes.VALUE_COLLECTION:
    case ReturnTypes.COMPLEX_COLLECTION:
      return convertV4CollectionResponse;
    default:
      return undefined;
  }
}

function getResponseConverterV2(returnType: ReturnTypes): ResponseConverterV2 | undefined {
  switch (returnType) {
    case ReturnTypes.VALUE:
      return convertV2ValueResponse;
    case ReturnTypes.COMPLEX:
      return convertV2ModelResponse;
    case ReturnTypes.VALUE_COLLECTION:
    case ReturnTypes.COMPLEX_COLLECTION:
      return convertV2CollectionResponse;
    default:
      return undefined;
  }
}

export class OperationReturnType<QObject extends QParamModel<any, any> | void> {
  constructor(public readonly returnType: ReturnTypes, public readonly type: QObject | undefined = undefined) {}

  private doConvert(response: HttpResponseModel<any>, isV2: boolean = false) {
    const responseConverter = isV2 ? getResponseConverterV2(this.returnType) : getResponseConverter(this.returnType);
    if (!this.type || !responseConverter) {
      return response;
    }

    return responseConverter(response, this.type);
  }

  public convertResponse(response: HttpResponseModel<any>) {
    return this.doConvert(response);
  }

  public convertResponseV2(response: HttpResponseModel<any>) {
    return this.doConvert(response, true);
  }
}

export const emptyOperationReturnType = new OperationReturnType<void>(ReturnTypes.VOID);
