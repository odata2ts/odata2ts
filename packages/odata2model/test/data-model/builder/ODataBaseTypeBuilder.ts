import { NavigationProperty, Property } from "../../../src/odata/ODataEdmxModel";

export class ODataBaseTypeBuilder {
  protected createProperty(name: string, type: string, nullable?: boolean, maxLength?: number, precision?: number) {
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

    /*
    if (keyProp) {
      this.complexType.Key.push({
        PropertyRef: [
          {
            $: { Name: name },
          },
        ],
      });
    }*/
    return prop;
  }

  public createNavProp(name: string, type: string, partner?: string, nullable?: boolean) {
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
}
