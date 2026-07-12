import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataValueResponseV2 } from "@odata2ts/odata-core";
import { MainResponseConverter } from "../MainResponseConverter";
import { ResponseValueConverterV2 } from "../ResponseDataConverter";

export class ValueResponseConverterV2<T> extends MainResponseConverter<ODataValueResponseV2<T>, T> {
  public convert(response: HttpResponseModel<any>): HttpResponseModel<ODataValueResponseV2<T>> {
    const data = response.data;
    const value = data?.d;
    if (typeof value === "object") {
      const converter = this.converter as ResponseValueConverterV2<T>;
      // we try to match by known attribute name
      const name = typeof converter.getName === "function" ? converter.getName() : undefined;
      const mappedName = typeof converter.getMappedName === "function" ? converter.getMappedName() : name;
      if (name && mappedName && value.hasOwnProperty(name)) {
        // map attribute name and convert the attribute value
        data.d = { [mappedName]: this.applyConverter(value[name]) };
      }
      // alternatively, if single attribute is given, then we use that one
      else {
        const keyValue = Object.entries(value);
        if (keyValue.length === 1) {
          const [key, val] = keyValue[0];
          // convert value only
          data.d[key] = this.applyConverter(val as T);
        }
      }
    }

    return response;
  }
}
