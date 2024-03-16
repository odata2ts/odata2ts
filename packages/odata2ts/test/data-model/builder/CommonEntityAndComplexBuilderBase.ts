import { ComplexType, EntityType } from "../../../src/data-model/edmx/ODataEdmxModelBase";

export interface EntityOrComplexBuilderOptions {
  baseType?: string;
  abstract?: boolean;
  open?: boolean;
}

export abstract class CommonEntityAndComplexBuilderBase {
  public constructor(private name: string, private options?: EntityOrComplexBuilderOptions) {}

  protected createComplexType(): ComplexType {
    return {
      $: {
        Name: this.name,
        ...(this.options?.baseType ? { BaseType: this.options.baseType } : {}),
        ...(this.options?.abstract ? { Abstract: "true" } : {}),
        ...(this.options?.open ? { OpenType: "true" } : {}),
      },
      Property: [],
    };
  }

  protected createEntityType(): EntityType {
    return {
      ...this.createComplexType(),
      Key: [{ PropertyRef: [] }],
    };
  }
}
