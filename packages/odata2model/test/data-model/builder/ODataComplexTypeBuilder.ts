import { ComplexType } from "../../../src/odata/ODataEdmxModel";
import { ODataBaseTypeBuilder } from "./ODataBaseTypeBuilder";

export class ODataComplexTypeBuilder extends ODataBaseTypeBuilder {
  private complexType: ComplexType;

  constructor(name: string, baseType?: string) {
    super();
    this.complexType = {
      $: {
        Name: name,
        BaseType: baseType,
      },
      Property: [],
    };
  }

  public getComplexType() {
    return this.complexType;
  }

  public addProp(name: string, type: string, nullable?: boolean, maxLength?: number, precision?: number) {
    const prop = this.createProperty(name, type, nullable, maxLength, precision);
    this.complexType.Property.push(prop);
    return this;
  }

  public addNavProp(name: string, type: string, partner?: string, nullable?: boolean) {
    if (!this.complexType.NavigationProperty) {
      this.complexType.NavigationProperty = [];
    }
    this.complexType.NavigationProperty.push(this.createNavProp(name, type, partner, nullable));

    return this;
  }
}
