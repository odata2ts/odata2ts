import { ParamValueModel, ValueConverter } from "@odata2ts/converter-api";

export const converterWithWrongId: ValueConverter<number, string> = {
  id: "ooopsWrongId",
  from: "number",
  to: "string",
  convertFrom: (value: ParamValueModel<number>): ParamValueModel<string> =>
    typeof value !== "number" ? value : String(value),
  convertTo: (value: ParamValueModel<string>): ParamValueModel<number> =>
    typeof value !== "string" ? value : Number(value),
};
