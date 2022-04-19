import { ODataEntityTypeBuilderBase } from "../ODataEntityTypeBuilderBase";
import { Association, EntityTypeV3, NavigationProperty } from "../../../../src/data-model/edmx/ODataEdmxModelV3";

export class ODataEntityTypeBuilderV2 extends ODataEntityTypeBuilderBase<EntityTypeV3> {
  private associations: Array<Association> = [];

  protected createVersionedEntityType(): EntityTypeV3 {
    return this.createEntityType();
  }

  public getAssociations() {
    return this.associations;
  }

  public addNavProp(name: string, type: string, relationship: string, multiplicity: string) {
    if (!this.entityType.NavigationProperty) {
      this.entityType.NavigationProperty = [];
    }

    const tmp = type.split(".");
    const eType = tmp.length === 1 ? tmp[0] : tmp[1];
    const fromRole = `${this.entityType.$.Name}_${eType}`;
    const toRole = `${eType}_${this.entityType.$.Name}`;

    this.associations.push({
      $: { Name: relationship },
      End: [
        {
          $: {
            Role: toRole,
            Type: type,
            Multiplicity: multiplicity,
          },
        },
      ],
    });

    this.entityType.NavigationProperty.push({
      $: {
        Name: name,
        Relationship: relationship,
        FromRole: fromRole,
        ToRole: toRole,
      },
    });

    return this;
  }
}
