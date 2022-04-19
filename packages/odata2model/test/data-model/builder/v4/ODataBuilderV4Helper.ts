import { NavigationProperty } from "../../../../src/data-model/edmx/ODataEdmxModelV4";

export function createNavProp(name: string, type: string, partner?: string, nullable?: boolean) {
  const navProp: NavigationProperty = {
    $: {
      Name: name,
      Type: type,
    },
  };
  if (partner) {
    navProp.$.Partner = partner;
  }
  if (typeof nullable === "boolean") {
    navProp.$.Nullable = nullable ? "true" : "false";
  }

  return navProp;
}
