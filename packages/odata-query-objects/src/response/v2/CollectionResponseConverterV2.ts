import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV2 } from "@odata2ts/odata-core";
import { MainResponseConverter } from "../MainResponseConverter";

export class CollectionResponseConverterV2<T> extends MainResponseConverter<T, ODataCollectionResponseV2<T>> {
  public convert(response: HttpResponseModel<any>): HttpResponseModel<ODataCollectionResponseV2<T>> {
    const data = response.data;
    const value = data?.d?.results;
    if (value && typeof value === "object") {
      data.d.results = this.applyConverter(value);
    }
    // support for V1
    else if (data?.d && typeof data.d === "object") {
      data.d = this.applyConverter(data.d);
    }

    return response;
  }
}
