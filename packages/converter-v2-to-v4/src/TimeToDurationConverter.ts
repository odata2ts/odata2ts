import { ParamValueModel, ValueConverter } from "@odata2ts/converter-api";
import { ODataTypesV2, ODataTypesV4 } from "@odata2ts/odata-core";

/**
 * V2 type Edm.Time is actually specified in ISO8601 duration format.
 * Hence, only relabeling is needed.
 */
export const timeToDurationConverter: ValueConverter<string, string> = {
  id: "timeToDurationConverter",
  from: ODataTypesV2.Time,
  to: ODataTypesV4.Duration,

  convertFrom: function (value: ParamValueModel<string>): ParamValueModel<string> {
    return value;
  },

  convertTo: function (value: ParamValueModel<string>): ParamValueModel<string> {
    return value;
  },
};
