import { ComplexType } from "../../../src/data-model/edmx/ODataEdmxModelBase.js";
import { CommonEntityAndComplexBuilderBase } from "./CommonEntityAndComplexBuilderBase.js";
import { createProperty } from "./ODataBuilderHelper.js";

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
