import { ParamValueModel, ValueConverter } from "@odata2ts/converter-api";
import { ODataTypesV2 } from "@odata2ts/odata-core";

/**
 * V2 maps certain number types to string values, while V4 maps all number types to number values.
 * This converter converts those V2 string based numbers to JS numbers in order to align with V4.
 *
 * Since The JS number type is not sufficient to represent all possible Edm.Int64 and Edm.Decimal values,
 * V4 also defines a technique, so that those data types can be retrieved as strings.
 * Another converter would need to take care of that.
 */
export const stringToNumberConverter: ValueConverter<string, number> = {
  id: "stringToNumberConverter",
  from: [
    ODataTypesV2.Byte,
    ODataTypesV2.SByte,
    ODataTypesV2.Single,
    ODataTypesV2.Double,
    ODataTypesV2.Int64,
    ODataTypesV2.Decimal,
  ],
  to: "number",

  convertFrom: function (value: ParamValueModel<string>): ParamValueModel<number> {
    if (typeof value !== "string") {
      return value;
    }

    const val = Number(value);
    return !isNaN(val) ? val : undefined;
  },

  convertTo: function (value: ParamValueModel<number>): ParamValueModel<string> {
    if (typeof value !== "number") {
      return value;
    }

    return !isNaN(value) ? String(value) : undefined;
  },
};
