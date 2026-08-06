import { ParamValueModel, ValueConverter } from "@odata2ts/converter-api";

/**
 * A target type that only exists inside a namespace, like bignumber.js' `BigNumber.Instance`.
 * Only `Nested` is importable - `Nested.Model` has to be written at the place the type is used.
 */
export namespace Nested {
  export interface Model {
    value: string;
  }
}

export const stringToNamespacedModelConverter: ValueConverter<string, Nested.Model> = {
  id: "stringToNamespacedModelConverter",
  from: "Edm.String",
  to: { module: "@odata2ts/test-converters", type: "Nested.Model" },

  convertFrom(value: ParamValueModel<string>): ParamValueModel<Nested.Model> {
    return typeof value === "string" ? { value } : value;
  },
  convertTo(value: ParamValueModel<Nested.Model>): ParamValueModel<string> {
    return typeof value === "object" ? value?.value : value;
  },
};
