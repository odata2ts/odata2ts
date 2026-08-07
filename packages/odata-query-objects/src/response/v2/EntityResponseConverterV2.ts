import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataEntityModelResponseV2, ODataModelResponseV4 } from "@odata2ts/odata-core";
import { MainResponseConverter } from "../MainResponseConverter";
import { ResponseDataConverter } from "../ResponseDataConverter";
import { reshapeV2ResponseAsV4 } from "./reshapeV2ResponseAsV4";

/**
 * Converts a V2 entity response.
 *
 * By default the V2 envelope (`{ d: { ...entity, __metadata } }`) is handed through untouched, only the
 * entity's own properties are converted. Pass `asV4: true` to reshape the whole response as its V4
 * equivalent instead - the bare entity plus `@odata.*` control information - see
 * {@link reshapeV2ResponseAsV4}.
 */
export class EntityResponseConverterV2<T, AsV4 extends boolean = false> extends MainResponseConverter<
  AsV4 extends true ? ODataModelResponseV4<T> : ODataEntityModelResponseV2<T>,
  T
> {
  public constructor(
    converter: ResponseDataConverter<T>,
    private asV4?: AsV4,
  ) {
    super(converter);
  }

  public convert(response: HttpResponseModel<any>): HttpResponseModel<any> {
    const data = response.data;
    if (data?.d && typeof data.d === "object") {
      const converted = this.applyConverter(data.d);
      if (this.asV4) {
        response.data = reshapeV2ResponseAsV4(converted);
      } else {
        data.d = converted;
      }
    }

    return response;
  }
}
