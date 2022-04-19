import { ODataEntityTypeBuilderBase } from "../ODataEntityTypeBuilderBase";
import { EntityTypeV4 } from "../../../../src/data-model/edmx/ODataEdmxModelV4";
import { createNavProp } from "./ODataBuilderV4Helper";

export class ODataEntityTypeBuilderV4 extends ODataEntityTypeBuilderBase<EntityTypeV4> {
  protected createVersionedEntityType(): EntityTypeV4 {
    return this.createEntityType();
  }

  public addNavProp(name: string, type: string, partner?: string, nullable?: boolean) {
    if (!this.entityType.NavigationProperty) {
      this.entityType.NavigationProperty = [];
    }
    this.entityType.NavigationProperty.push(createNavProp(name, type, partner, nullable));

    return this;
  }
}
