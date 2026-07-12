import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataComplexModelResponseV2, ODataEntityModelResponseV2 } from "@odata2ts/odata-core";
import { MainResponseConverter } from "../MainResponseConverter";

export class EntityResponseConverterV2<T> extends MainResponseConverter<T, ODataEntityModelResponseV2<T>> {
  public convert(response: HttpResponseModel<any>): HttpResponseModel<ODataEntityModelResponseV2<T>> {
    const data = response.data;
    if (data?.d && typeof data.d === "object") {
      data.d = this.applyConverter(data.d);
    }

    return response;
  }
}
