import { Association, EntityTypeV3 } from "../../../../src/data-model/edmx/ODataEdmxModelV3.js";
import { ODataEntityTypeBuilderBase } from "../ODataEntityTypeBuilderBase.js";

export class ODataEntityTypeBuilderV2 extends ODataEntityTypeBuilderBase<EntityTypeV3> {
  private associations: Array<Association> = [];

  protected createVersionedEntityType(): EntityTypeV3 {
    const entityType = this.createEntityType();
    // V2 spells the media entity marker in the metadata namespace
    const { HasStream, ...attributes } = entityType.$;

    return {
      ...entityType,
      $: { ...attributes, ...(HasStream ? { "m:HasStream": HasStream } : {}) },
    };
  }

  public getAssociations() {
    return this.associations;
  }

  /**
   * @param roles the association roles; by default they are derived from the two type names, which is not
   * unique as soon as one entity type points at another one more than once - specify them in that case
   * @param referentialConstraint the foreign key realizing this association, stated from this navigation
   * property's own side: `property` names one of this entity type's own properties, `referencedProperty`
   * the property of the target type it references. V2 states the constraint once per association rather
   * than per end, so this is only meaningful on the call for the side that actually points at the
   * principal - the merge in {@link ODataModelBuilderV2.addEntityType} carries it onto the shared
   * `<Association>` regardless of which of the two `addNavProp` calls supplies it.
   */
  public addNavProp(
    name: string,
    type: string,
    relationship: string,
    multiplicity: string,
    roles?: { fromRole: string; toRole: string },
    referentialConstraint?: Array<{ property: string; referencedProperty: string }>,
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
      ...(referentialConstraint
        ? {
            ReferentialConstraint: [
              {
                Principal: [
                  {
                    $: { Role: toRole },
                    PropertyRef: referentialConstraint.map((rc) => ({ $: { Name: rc.referencedProperty } })),
                  },
                ],
                Dependent: [
                  {
                    $: { Role: fromRole },
                    PropertyRef: referentialConstraint.map((rc) => ({ $: { Name: rc.property } })),
                  },
                ],
              },
            ],
          }
        : undefined),
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
