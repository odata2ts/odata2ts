import { HttpResponseModel } from "@odata2ts/odata-client-api";
import { ODataCollectionResponseV2, ODataModelResponseV2 } from "@odata2ts/odata-core";
import { QueryObject } from "@odata2ts/odata-query-objects";
import { ODataUriBuilderV2, createUriBuilderV2 } from "@odata2ts/odata-uri-builder";

import { OperationBaseService } from "../OperationBaseService";

export class ServiceBaseV2<T, Q extends QueryObject> extends OperationBaseService<Q, ODataUriBuilderV2<Q>> {
  protected createBuilder(): ODataUriBuilderV2<Q> {
    return createUriBuilderV2(this.getPath(), this.qModel);
  }

  protected convertModelResponse(response: HttpResponseModel<ODataModelResponseV2<any>>) {
    const data = response.data?.d;
    if (data) {
      response.data.d = this.qModel.convertFromOData(data);
    }
    return response;
  }
  protected convertCollectionResponse(response: HttpResponseModel<ODataCollectionResponseV2<any>>) {
    const data = response.data?.d?.results;
    if (data) {
      response.data.d.results = this.qModel.convertFromOData(data);
    }
    return response;
  }
}
