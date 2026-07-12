import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataModelResponseV4 } from "@odata2ts/odata-core";
import { MainResponseConverter } from "../MainResponseConverter";

/**
 * For response types: EntityType and ComplexType.
 */
export class ModelResponseConverterV4<T> extends MainResponseConverter<ODataModelResponseV4<T>, T> {
  public convert(response: HttpResponseModel<any>): HttpResponseModel<ODataModelResponseV4<T>> {
    const data = response.data;
    if (data && typeof data === "object") {
      response.data = this.applyConverter(data);
    }
    return response;
  }
}
