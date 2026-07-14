import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV4 } from "@odata2ts/odata-core";
import { MainResponseConverter } from "../MainResponseConverter";

/**
 * For response types: EntityType and ComplexType.
 */
export class CollectionResponseConverterV4<T> extends MainResponseConverter<ODataCollectionResponseV4<T>, T> {
  public convert(response: HttpResponseModel<any>): HttpResponseModel<ODataCollectionResponseV4<T>> {
    const data = response.data;
    if (data && data.value && typeof data.value === "object") {
      data.value = this.applyConverter(data.value);
    }

    return response;
  }
}
