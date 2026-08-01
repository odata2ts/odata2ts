import { ComplexType, EntityType } from "../../../src/data-model/edmx/ODataEdmxModelBase.js";

export interface EntityOrComplexBuilderOptions {
  baseType?: string;
  abstract?: boolean;
  open?: boolean;
  /** Media entity: only meaningful on entity types, and only in V4. */
  hasStream?: boolean;
}

export abstract class CommonEntityAndComplexBuilderBase {
  public constructor(
    private name: string,
    private options?: EntityOrComplexBuilderOptions,
  ) {}

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
    const complexType = this.createComplexType();

    return {
      ...complexType,
      $: {
        ...complexType.$,
        ...(this.options?.hasStream ? { HasStream: "true" as const } : {}),
      },
      Key: [{ PropertyRef: [] }],
    };
  }
}
