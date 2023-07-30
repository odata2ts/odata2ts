import { ODataVersions } from "@odata2ts/odata-core";

import { ComplexType, EntityType, ODataEdmxModelBase, Schema } from "../../../src/data-model/edmx/ODataEdmxModelBase";
import { ODataComplexTypeBuilderBase } from "./ODataComplexTypeBuilderBase";
import { ODataEntityTypeBuilderBase } from "./ODataEntityTypeBuilderBase";

export abstract class ODataModelBuilder<
  M extends ODataEdmxModelBase<S>,
  S extends Schema<ET, CT>,
  ET extends EntityType,
  CT extends ComplexType
> {
  protected schemas: Array<S> = [];
  protected currentSchema: S;
  protected model: ODataEdmxModelBase<Schema<ET, CT>>;

  protected constructor(protected serviceName: string, protected version: ODataVersions) {
    this.currentSchema = this.createSchema(serviceName);
    this.model = this.createModel(version);
  }

  public addSchema(name: string, alias?: string) {
    this.currentSchema = this.createSchema(name, alias);
    return this;
  }

  public abstract addEntityType(
    name: string,
    baseType: string | undefined,
    builderFn: <ETB extends ODataEntityTypeBuilderBase<ET>>(builder: ETB) => void
  ): this;
  public abstract addComplexType(
    name: string,
    baseType: string | undefined,
    builderFn: <CTB extends ODataComplexTypeBuilderBase<CT>>(builder: CTB) => void
  ): this;

  protected createSchema(name: string, alias?: string) {
    const result: Schema<ET, CT> = {
      $: {
        Namespace: name,
        xmlns: "ignore",
      },
    };
    if (alias) {
      result.$.Alias = alias;
    }
    const casted = result as unknown as S;

    this.schemas.push(casted);
    return casted;
  }
  protected createModel(odataVersion: ODataVersions): ODataEdmxModelBase<Schema<ET, CT>> {
    return {
      "edmx:Edmx": {
        $: {
          Version: odataVersion === ODataVersions.V2 ? "1.0" : "4.0",
          "xmlns:edmx": "ignore",
        },
        "edmx:DataServices": [
          {
            Schema: this.schemas,
          },
        ],
      },
    };
  }

  public getModel() {
    return this.model;
  }

  public getSchemas() {
    return this.schemas;
  }

  protected getEntityContainer() {
    // @ts-ignore
    if (!this.currentSchema.EntityContainer) {
      // @ts-ignore
      this.currentSchema.EntityContainer = [
        {
          $: { Name: "ignore" },
        },
      ];
    }
    // @ts-ignore
    return this.currentSchema.EntityContainer[0];
  }

  public addEnumType(name: string, values: Array<{ name: string; value: number }>) {
    if (!this.currentSchema.EnumType) {
      this.currentSchema.EnumType = [];
    }

    this.currentSchema.EnumType.push({
      $: {
        Name: name,
      },
      Member: values.map((v) => ({
        $: {
          Name: v.name,
          Value: v.value,
        },
      })),
    });

    return this;
  }
}
