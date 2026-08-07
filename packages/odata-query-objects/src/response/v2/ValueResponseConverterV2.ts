import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataValueResponseV2, ODataValueResponseV4 } from "@odata2ts/odata-core";
import { MainResponseConverter } from "../MainResponseConverter";
import { ResponseValueConverterV2 } from "../ResponseDataConverter";
import { reshapeV2ResponseAsV4 } from "./reshapeV2ResponseAsV4";

/**
 * Converts a V2 value response.
 *
 * By default the V2 envelope (`{ d: { <propName>: value } }`) is handed through untouched, only the value
 * itself is converted. Pass `asV4: true` to reshape the whole response as its V4 equivalent instead -
 * `{ value: ... }` - see {@link reshapeV2ResponseAsV4}.
 */
export class ValueResponseConverterV2<T, AsV4 extends boolean = false> extends MainResponseConverter<
  AsV4 extends true ? ODataValueResponseV4<T> : ODataValueResponseV2<T>,
  T
> {
  public constructor(
    converter: ResponseValueConverterV2<T>,
    private asV4?: AsV4,
  ) {
    super(converter);
  }

  public convert(response: HttpResponseModel<any>): HttpResponseModel<any> {
    const data = response.data;
    const value = data?.d;
    if (typeof value !== "object") {
      return response;
    }

    const converter = this.converter as ResponseValueConverterV2<T>;
    // we try to match by known attribute name
    const name = typeof converter.getName === "function" ? converter.getName() : undefined;
    const mappedName = typeof converter.getMappedName === "function" ? converter.getMappedName() : name;

    if (name && mappedName && value.hasOwnProperty(name)) {
      // map attribute name and convert the attribute value
      const converted = this.applyConverter(value[name]);
      if (this.asV4) {
        response.data = { value: reshapeV2ResponseAsV4(converted) };
      } else {
        data.d = { [mappedName]: converted };
      }
    }
    // alternatively, if single attribute is given, then we use that one
    else {
      const keyValue = Object.entries(value);
      if (keyValue.length === 1) {
        const [key, val] = keyValue[0];
        const converted = this.applyConverter(val as T);
        if (this.asV4) {
          response.data = { value: reshapeV2ResponseAsV4(converted) };
        } else {
          // convert value only
          data.d[key] = converted;
        }
      }
    }

    return response;
  }
}
