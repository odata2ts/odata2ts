import { Association, EntityTypeV3 } from "../../../../src/data-model/edmx/ODataEdmxModelV3.js";
import { ODataEntityTypeBuilderBase } from "../ODataEntityTypeBuilderBase.js";

export class ODataEntityTypeBuilderV2 extends ODataEntityTypeBuilderBase<EntityTypeV3> {
  private associations: Array<Association> = [];

  protected createVersionedEntityType(): EntityTypeV3 {
    return this.createEntityType();
  }

  public getAssociations() {
    return this.associations;
  }

  /**
   * @param roles the association roles; by default they are derived from the two type names, which is not
   * unique as soon as one entity type points at another one more than once - specify them in that case
   */
  public addNavProp(
    name: string,
    type: string,
    relationship: string,
    multiplicity: string,
    roles?: { fromRole: string; toRole: string },
  ) {
    if (!this.entityType.NavigationProperty) {
      this.entityType.NavigationProperty = [];
    }

    const tmp = type.split(".");
    const eType = tmp.length === 1 ? tmp[0] : tmp[1];
    const fromRole = roles?.fromRole ?? `${this.entityType.$.Name}_${eType}`;
    const toRole = roles?.toRole ?? `${eType}_${this.entityType.$.Name}`;

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
