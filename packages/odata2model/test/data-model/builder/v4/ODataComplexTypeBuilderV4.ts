import { ComplexTypeV4 } from "../../../../src/data-model/edmx/ODataEdmxModelV4";
import { ODataComplexTypeBuilderBase } from "../ODataComplexTypeBuilderBase";
import { createNavProp } from "./ODataBuilderV4Helper";

export class ODataComplexTypeBuilderV4 extends ODataComplexTypeBuilderBase<ComplexTypeV4> {
  protected createVersionedComplexType(): ComplexTypeV4 {
    return this.createComplexType();
  }

  public addNavProp(name: string, type: string, partner?: string, nullable?: boolean) {
    if (!this.complexType.NavigationProperty) {
      this.complexType.NavigationProperty = [];
    }
    this.complexType.NavigationProperty.push(createNavProp(name, type, partner, nullable));

    return this;
  }
}
