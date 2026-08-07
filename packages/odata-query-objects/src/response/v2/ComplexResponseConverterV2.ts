import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataComplexModelResponseV2, ODataModelResponseV4 } from "@odata2ts/odata-core";
import { MainResponseConverter } from "../MainResponseConverter";
import { ResponseDataConverter } from "../ResponseDataConverter";
import { reshapeV2ResponseAsV4 } from "./reshapeV2ResponseAsV4";

/**
 * Converts a V2 complex-type response.
 *
 * By default the V2 envelope (`{ d: { <propName>: { ...value, __metadata } } }`) is handed through
 * untouched, only the value itself is converted. Pass `asV4: true` to reshape the whole response as its V4
 * equivalent instead - the bare value plus `@odata.*` control information - see
 * {@link reshapeV2ResponseAsV4}.
 */
export class ComplexResponseConverterV2<T, AsV4 extends boolean = false> extends MainResponseConverter<
  AsV4 extends true ? ODataModelResponseV4<T> : ODataComplexModelResponseV2<T>,
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
    if (typeof data?.d === "object") {
      const values = Object.values(data.d);
      if (values.length === 1 && typeof values[0] === "object") {
        const converted = this.applyConverter(values[0] as T);
        if (this.asV4) {
          response.data = reshapeV2ResponseAsV4(converted);
        } else {
          data.d = converted;
        }
      }
    }

    return response;
  }
}
