import { ComplexTypeV3 } from "../../../../src/data-model/edmx/ODataEdmxModelV3.js";
import { ODataComplexTypeBuilderBase } from "../ODataComplexTypeBuilderBase.js";

export class ODataComplexTypeBuilderV2 extends ODataComplexTypeBuilderBase<ComplexTypeV3> {
  protected createVersionedComplexType(): ComplexTypeV3 {
    return this.createComplexType();
  }
}
