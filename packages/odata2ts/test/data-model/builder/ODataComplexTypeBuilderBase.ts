import { ComplexType } from "../../../src/data-model/edmx/ODataEdmxModelBase";
import { createProperty } from "./ODataBuilderHelper";

export abstract class ODataComplexTypeBuilderBase<CT extends ComplexType> {
  protected complexType: CT = this.createVersionedComplexType();

  constructor(private name: string, private baseType?: string) {}

  protected abstract createVersionedComplexType(): CT;

  protected createComplexType() {
    return {
      $: {
        Name: this.name,
        BaseType: this.baseType,
      },
      Property: [],
    };
  }

  public getComplexType() {
    return this.complexType;
  }

  public addProp(name: string, type: string, nullable?: boolean, maxLength?: number, precision?: number) {
    const prop = createProperty(name, type, nullable, maxLength, precision);
    this.complexType.Property.push(prop);
    return this;
  }
}
