import {
  ComplexTypeV3,
  EntityTypeV3,
  ODataEdmxModelV3,
  SchemaV3,
} from "../../../../src/data-model/edmx/ODataEdmxModelV3";
import { ODataEntityTypeBuilderV2 } from "./ODataEntityTypeBuilderV2";
import { ODataComplexTypeBuilderV2 } from "./ODataComplexTypeBuilderV2";
import { ODataFunctionBuilderV2 } from "./ODataFunctionBuilderV2";
import { ODataModelBuilder, ODataVersion } from "../ODataModelBuilder";

export class ODataModelBuilderV2 extends ODataModelBuilder<ODataEdmxModelV3, SchemaV3, EntityTypeV3, ComplexTypeV3> {
  constructor(serviceName: string) {
    super(serviceName);
  }

  protected createVersionedModel(): ODataEdmxModelV3 {
    return this.createModel(ODataVersion.V2);
  }

  protected createVersionedSchema(): SchemaV3 {
    return this.createSchema();
  }

  public addEntitySet(name: string, entityType: string) {
    const container = this.getEntityContainer();
    if (!container.EntitySet) {
      container.EntitySet = [];
    }

    container.EntitySet.push({
      $: {
        Name: name,
        EntityType: entityType,
      },
    });

    return this;
  }

  public addFunctionImport(
    name: string,
    returnType?: string,
    paramBuilder?: (builder: ODataFunctionBuilderV2) => void
  ) {
    const container = this.getEntityContainer();
    if (!container.FunctionImport) {
      container.FunctionImport = [];
    }

    const builder = new ODataFunctionBuilderV2(name, returnType);
    if (paramBuilder) {
      paramBuilder(builder);
    }
    container.FunctionImport.push(builder.getFunction());

    return this;
  }

  public addEntityType(
    name: string,
    baseType: string | undefined,
    builderFn: (builder: ODataEntityTypeBuilderV2) => void
  ) {
    if (!this.schema.EntityType) {
      this.schema.EntityType = [];
    }

    const builder = new ODataEntityTypeBuilderV2(name, baseType);
    builderFn(builder);
    this.schema.EntityType.push(builder.getEntityType());

    // add or update associations
    const assocs = builder.getAssociations();
    if (assocs.length) {
      if (!this.schema.Association) {
        this.schema.Association = [];
      }

      assocs.forEach((assoc) => {
        const existingAssoc = this.schema.Association!.find((a) => a.$.Name === assoc.$.Name);
        if (existingAssoc) {
          existingAssoc.End.push(...assoc.End);
        } else {
          this.schema.Association!.push(assoc);
        }
      });
    }

    return this;
  }

  public addComplexType(
    name: string,
    baseType: string | undefined,
    builderFn: (builder: ODataComplexTypeBuilderV2) => void
  ) {
    if (!this.schema.ComplexType) {
      this.schema.ComplexType = [];
    }

    const builder = new ODataComplexTypeBuilderV2(name, baseType);
    builderFn(builder);
    this.schema.ComplexType.push(builder.getComplexType());

    return this;
  }
}
