import { ODataVersions } from "@odata2ts/odata-core";

import {
  ComplexTypeV3,
  EntityTypeV3,
  ODataEdmxModelV3,
  SchemaV3,
} from "../../../../src/data-model/edmx/ODataEdmxModelV3";
import { ODataModelBuilder } from "../ODataModelBuilder";
import { ODataComplexTypeBuilderV2 } from "./ODataComplexTypeBuilderV2";
import { ODataEntityTypeBuilderV2 } from "./ODataEntityTypeBuilderV2";
import { ODataFunctionBuilderV2 } from "./ODataFunctionBuilderV2";

export class ODataModelBuilderV2 extends ODataModelBuilder<ODataEdmxModelV3, SchemaV3, EntityTypeV3, ComplexTypeV3> {
  constructor(serviceName: string) {
    super(serviceName, ODataVersions.V2);
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
    paramBuilder?: (builder: ODataFunctionBuilderV2) => void,
    usePostMethod?: boolean
  ) {
    const container = this.getEntityContainer();
    if (!container.FunctionImport) {
      container.FunctionImport = [];
    }

    const builder = new ODataFunctionBuilderV2(name, returnType, usePostMethod);
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
    if (!this.currentSchema.EntityType) {
      this.currentSchema.EntityType = [];
    }

    const builder = new ODataEntityTypeBuilderV2(name, baseType);
    builderFn(builder);
    this.currentSchema.EntityType.push(builder.getEntityType());

    // add or update associations
    const assocs = builder.getAssociations();
    if (assocs.length) {
      if (!this.currentSchema.Association) {
        this.currentSchema.Association = [];
      }

      assocs.forEach((assoc) => {
        const existingAssoc = this.currentSchema.Association!.find((a) => a.$.Name === assoc.$.Name);
        if (existingAssoc) {
          existingAssoc.End.push(...assoc.End);
        } else {
          this.currentSchema.Association!.push(assoc);
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
    if (!this.currentSchema.ComplexType) {
      this.currentSchema.ComplexType = [];
    }

    const builder = new ODataComplexTypeBuilderV2(name, baseType);
    builderFn(builder);
    this.currentSchema.ComplexType.push(builder.getComplexType());

    return this;
  }
}
