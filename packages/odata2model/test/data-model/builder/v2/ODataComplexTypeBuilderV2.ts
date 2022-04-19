import { ComplexTypeV3 } from "../../../../src/data-model/edmx/ODataEdmxModelV3";
import { ODataComplexTypeBuilderBase } from "../ODataComplexTypeBuilderBase";

export class ODataComplexTypeBuilderV2 extends ODataComplexTypeBuilderBase<ComplexTypeV3> {
  protected createVersionedComplexType(): ComplexTypeV3 {
    return this.createComplexType();
  }
}
