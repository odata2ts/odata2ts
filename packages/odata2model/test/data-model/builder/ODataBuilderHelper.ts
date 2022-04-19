import { Property } from "../../../src/data-model/edmx/ODataEdmxModelBase";

export function createProperty(name: string, type: string, nullable?: boolean, maxLength?: number, precision?: number) {
  const prop: Property = {
    $: {
      Name: name,
      Type: type,
    },
  };
  if (typeof nullable === "boolean") {
    prop.$.Nullable = nullable ? "true" : "false";
  }
  if (typeof maxLength === "number") {
    prop.$.MaxLength = maxLength;
  }
  if (typeof precision === "number") {
    prop.$.Precision = precision;
  }

  return prop;
}
