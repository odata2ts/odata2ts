import { ParamValueModel, ValueConverter } from "@odata2ts/converter-api";

export const guidToGuidStringConverter: ValueConverter<string, string> = {
  id: "guidToGuidStringConverter",
  from: "Edm.Guid",
  to: "string",
  convertFrom: (value: ParamValueModel<string>): ParamValueModel<string> => {
    return typeof value === "string" ? `guid'${value}'` : value;
  },
  convertTo: (value: ParamValueModel<string>): ParamValueModel<string> => {
    return typeof value !== "string" ? value : value.replace(/guid'([^']+)'/, "$1");
  },
};
