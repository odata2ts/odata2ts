import { ComplexType } from "../../../src/data-model/edmx/ODataEdmxModelBase";
import { CommonEntityAndComplexBuilderBase } from "./CommonEntityAndComplexBuilderBase";
import { createProperty } from "./ODataBuilderHelper";

export abstract class ODataComplexTypeBuilderBase<CT extends ComplexType> extends CommonEntityAndComplexBuilderBase {
  protected complexType: CT = this.createVersionedComplexType();

  protected abstract createVersionedComplexType(): CT;

  public getComplexType() {
    return this.complexType;
  }

  public addProp(name: string, type: string, nullable?: boolean, maxLength?: number, precision?: number) {
    const prop = createProperty(name, type, nullable, maxLength, precision);
    this.complexType.Property.push(prop);
    return this;
  }
}
