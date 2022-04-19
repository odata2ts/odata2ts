import { ComplexType, EntityType, ODataEdmxModelBase, Schema } from "../../../src/data-model/edmx/ODataEdmxModelBase";

export enum ODataVersion {
  V2 = "2.0",
  V4 = "4.0",
}

export abstract class ODataModelBuilder<
  M extends ODataEdmxModelBase<S>,
  S extends Schema<ET, CT>,
  ET extends EntityType,
  CT extends ComplexType
> {
  protected schema: S = this.createVersionedSchema();
  protected model: M = this.createVersionedModel();

  protected constructor(protected serviceName: string) {}

  protected abstract createVersionedSchema(): S;
  protected abstract createVersionedModel(): M;

  protected createSchema(): Schema<ET, CT> {
    return {
      $: {
        Namespace: this.serviceName,
        xmlns: "ignore",
      },
    };
  }
  protected createModel(odataVersion: string): ODataEdmxModelBase<S> {
    return {
      "edmx:Edmx": {
        $: {
          Version: odataVersion,
          "xmlns:edmx": "ignore",
        },
        "edmx:DataServices": [
          {
            Schema: [this.schema],
          },
        ],
      },
    };
  }

  public getModel() {
    return this.model;
  }

  public getSchema() {
    return this.schema;
  }

  protected getEntityContainer() {
    // @ts-ignore
    if (!this.schema.EntityContainer) {
      // @ts-ignore
      this.schema.EntityContainer = [
        {
          $: { Name: "ignore" },
        },
      ];
    }
    // @ts-ignore
    return this.schema.EntityContainer[0];
  }

  public addEnumType(name: string, values: Array<{ name: string; value: number }>) {
    if (!this.schema.EnumType) {
      this.schema.EnumType = [];
    }

    this.schema.EnumType.push({
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
