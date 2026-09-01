import { NavigationProperty } from "../../../../src/data-model/edmx/ODataEdmxModelV4.js";

export function createNavProp(
  name: string,
  type: string,
  partner?: string,
  nullable?: boolean,
  contained?: boolean,
  referentialConstraints?: Array<{ property: string; referencedProperty: string }>,
) {
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
  if (contained) {
    navProp.$.ContainsTarget = "true";
  }
  if (referentialConstraints?.length) {
    navProp.ReferentialConstraint = referentialConstraints.map((rc) => ({
      $: { Property: rc.property, ReferencedProperty: rc.referencedProperty },
    }));
  }

  return navProp;
}
