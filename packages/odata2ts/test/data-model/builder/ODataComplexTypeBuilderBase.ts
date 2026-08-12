import { Annotation, ComplexType } from "../../../src/data-model/edmx/ODataEdmxModelBase.js";
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

  public addPropAnnotations(propName: string, annotations: Array<Annotation>) {
    const prop = this.complexType.Property.find((p) => p.$.Name === propName);
    if (!prop) {
      throw new Error(`Cannot annotate unknown property [${propName}]!`);
    }
    this.annotate(prop, annotations);
    return this;
  }
}
