import { EntityType } from "../../../src/data-model/edmx/ODataEdmxModel";
import { ODataBaseTypeBuilder } from "./ODataBaseTypeBuilder";

export class ODataEntityTypeBuilder extends ODataBaseTypeBuilder {
  private entityType: EntityType;

  constructor(name: string, baseType?: string) {
    super();
    this.entityType = {
      $: {
        Name: name,
        BaseType: baseType,
      },
      Key: [{ PropertyRef: [] }],
      Property: [],
    };
  }

  public getEntityType() {
    return this.entityType;
  }

  public addProp(name: string, type: string, nullable?: boolean, maxLength?: number, precision?: number) {
    const prop = this.createProperty(name, type, nullable, maxLength, precision);
    this.entityType.Property.push(prop);
    return this;
  }

  public addNavProp(name: string, type: string, partner?: string, nullable?: boolean) {
    if (!this.entityType.NavigationProperty) {
      this.entityType.NavigationProperty = [];
    }
    this.entityType.NavigationProperty.push(this.createNavProp(name, type, partner, nullable));

    return this;
  }
  public addKeyProp(name: string, type: string, maxLength?: number, precision?: number) {
    const prop = this.createProperty(name, type, false, maxLength, precision);
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
