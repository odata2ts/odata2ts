import { EntityType } from "../../../src/data-model/edmx/ODataEdmxModelBase";
import { createProperty } from "./ODataBuilderHelper";

export abstract class ODataEntityTypeBuilderBase<ET extends EntityType> {
  protected entityType: ET = this.createVersionedEntityType();

  constructor(private name: string, private baseType?: string) {}

  protected abstract createVersionedEntityType(): ET;

  protected createEntityType() {
    return {
      $: {
        Name: this.name,
        BaseType: this.baseType,
      },
      Key: [{ PropertyRef: [] }],
      Property: [],
    };
  }

  public getEntityType() {
    return this.entityType;
  }

  public addProp(name: string, type: string, nullable?: boolean, maxLength?: number, precision?: number) {
    const prop = createProperty(name, type, nullable, maxLength, precision);
    this.entityType.Property.push(prop);
    return this;
  }

  public addKeyProp(name: string, type: string, maxLength?: number, precision?: number) {
    const prop = createProperty(name, type, false, maxLength, precision);
    this.entityType.Property.push(prop);
    this.entityType.Key[0].PropertyRef.push({ $: { Name: name } });

    return this;
  }

  // Only adds one key prop without adding the property itself to the props
  public addKeyOnly(name: string) {
    this.entityType.Key[0].PropertyRef.push({ $: { Name: name } });
    return this;
  }
}
