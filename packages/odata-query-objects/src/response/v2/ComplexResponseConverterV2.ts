import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataComplexModelResponseV2 } from "@odata2ts/odata-core";
import { MainResponseConverter } from "../MainResponseConverter";

export class ComplexResponseConverterV2<T> extends MainResponseConverter<T, ODataComplexModelResponseV2<T>> {
  public convert(response: HttpResponseModel<any>): HttpResponseModel<ODataComplexModelResponseV2<T>> {
    const data = response.data;
    if (typeof data?.d === "object") {
      const values = Object.values(data.d);
      if (values.length === 1 && typeof values[0] === "object") {
        data.d = this.applyConverter(values[0] as T);
      }
    }

    return response;
  }
}
