import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV2, ODataCollectionResponseV4 } from "@odata2ts/odata-core";
import { MainResponseConverter } from "../MainResponseConverter";
import { ResponseDataConverter } from "../ResponseDataConverter";
import { reshapeV2ResponseAsV4 } from "./reshapeV2ResponseAsV4";

/**
 * Converts a V2 collection response.
 *
 * By default, the V2 envelope (`{ d: { results: [...] } }`) is handed through untouched, only the entities
 * inside are converted. Pass `asV4: true` to reshape the whole response as its V4 equivalent instead -
 * `{ value: [...], "@odata.count"?, "@odata.nextLink"? }` - see {@link reshapeV2ResponseAsV4}.
 */
export class CollectionResponseConverterV2<T, AsV4 extends boolean = false> extends MainResponseConverter<
  AsV4 extends true ? ODataCollectionResponseV4<T> : ODataCollectionResponseV2<T>,
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
    const value = data?.d?.results;

    if (!this.asV4) {
      if (value && typeof value === "object") {
        data.d.results = this.applyConverter(value);
      }
      // support for V1
      else if (data?.d && typeof data.d === "object") {
        data.d = this.applyConverter(data.d);
      }

      return response;
    }

    let convertedValue: Array<T> | undefined;
    if (value && typeof value === "object") {
      convertedValue = reshapeV2ResponseAsV4(this.applyConverter(value));
    }
    // support for V1
    else if (data?.d && typeof data.d === "object") {
      convertedValue = reshapeV2ResponseAsV4(this.applyConverter(data.d));
    }

    if (convertedValue !== undefined) {
      const result: ODataCollectionResponseV4<T> = { value: convertedValue };
      if (data.d.__count !== undefined) {
        result["@odata.count"] = Number(data.d.__count);
      }
      if (data.d.__next) {
        result["@odata.nextLink"] = data.d.__next;
      }
      response.data = result;
    }

    return response;
  }
}
