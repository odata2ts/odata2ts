import { HttpResponseModel } from "@odata2ts/odata-client-api";
import { QueryObject } from "@odata2ts/odata-query-objects";
import { ODataUriBuilderV4, createUriBuilderV4 } from "@odata2ts/odata-uri-builder";

import { OperationBaseService } from "../OperationBaseService";
import { ODataCollectionResponseV4, ODataModelResponseV4 } from "./ResponseModelV4";

export class ServiceBaseV4<T, Q extends QueryObject> extends OperationBaseService<Q, ODataUriBuilderV4<Q>> {
  protected createBuilder(): ODataUriBuilderV4<Q> {
    return createUriBuilderV4(this.getPath(), this.qModel);
  }

  protected convertModelResponse(response: HttpResponseModel<ODataModelResponseV4<any>>) {
    const data = response.data;
    if (data) {
      response.data = this.qModel.convertFromOData(data);
    }
    return response;
  }

  protected convertCollectionResponse(response: HttpResponseModel<ODataCollectionResponseV4<any>>) {
    const data = response.data?.value;
    if (data) {
      response.data.value = this.qModel.convertFromOData(data);
    }
    return response;
  }
}
