import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataValueResponseV4 } from "@odata2ts/odata-core";
import { MainResponseConverter } from "../MainResponseConverter";

/**
 * Convert OData V4 value responses.
 */
export class ValueResponseConverterV4<T> extends MainResponseConverter<ODataValueResponseV4<T>, T> {
  public convert(response: HttpResponseModel<any>): HttpResponseModel<ODataValueResponseV4<T>> {
    const data = response.data?.value;

    if (data !== undefined && data !== null) {
      response.data.value = this.applyConverter(data);
    }

    return response;
  }
}
