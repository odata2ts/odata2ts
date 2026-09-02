import { ComplexType, EntitySetType, EntityType, PropertyModel } from "./DataTypeModel.js";

/**
 * The slice of `DataModel` the resolver actually reads - an interface rather than the class itself, so
 * this file has nothing to import from `DataModel.ts` and the two stay free of a circular dependency
 * (`DataModel` already imports this file for `resolveNavPropDerivation`).
 */
export interface NavPropDataModel {
  getEntityType(fqName: string): EntityType | undefined;
  getNavPropBindingTarget(fqEntityTypeName: string, navPropOdataName: string): EntitySetType | undefined;
}

export type DerivationGrade = "A" | "B" | "C";

export interface NavPropDerivation {
  readonly grade: DerivationGrade;
  /** The entity set the target belongs to; absent for grade C. */
  readonly targetSet?: EntitySetType;
  /** Where the re-rooted key is rooted: the entity set's type. */
  readonly rootType?: string;
  /** Set where the navigation property is narrower than its entity set - `Publisher/Books`. */
  readonly cast?: string;
  /**
   * Filter path ↦ the parent key property whose value fills it. Grade A uses a bare property of the
   * target type, grade B a navigation path through the inverse.
   */
  readonly filterPairs?: ReadonlyArray<{ filterPath: string; parentKeyProperty: string }>;
  /** Grade A to-one only: target key property ↦ the source key property holding its value. */
  readonly targetKeyPairs?: ReadonlyArray<{ targetKeyProperty: string; sourceKeyProperty: string }>;
}

const NOT_DERIVABLE: NavPropDerivation = { grade: "C" };

function findProp(type: ComplexType, odataName: string): PropertyModel | undefined {
  return type.baseProps.find((p) => p.odataName === odataName) ?? type.props.find((p) => p.odataName === odataName);
}

/**
 * Resolves how far a navigation property can be re-rooted at its own target type, from the metadata
 * alone.
 *
 * Grade A is a filter (to-many) or an entity key (to-one) built from a real property of the target
 * type - the form a hand-written query would use, and the reason it wins wherever both A and B apply.
 * Grade B falls back to the inverse `Partner` path where no usable constraint states the relation as a
 * property, which for a to-many means an `any()` lambda; a to-one is never grade B, since keying a single
 * entity as a filtered collection could never converge with anything a user writes by hand. Grade C means
 * nothing in the metadata makes the relation derivable at all.
 *
 * "Usable" is doing the real work in grade A: a to-many constraint counts only when every
 * `referencedProperty` is part of the *parent's* key, a to-one constraint only when every `property` is
 * part of the *source's* key. Either way, the parent/source key is all that is ever known from having
 * navigated to this resource - anything else about it is not known client-side, and a key built from it
 * would not be one a hand-written query could ever produce.
 *
 * Kept as a pure function of the digested model, rather than a method on `DataModel` itself, so the rules
 * stay testable in isolation and out of the already-large class - `DataModel#getNavPropDerivation` is the
 * thin, memoized entry point the generator actually calls.
 */
export function resolveNavPropDerivation(
  dataModel: NavPropDataModel,
  ownerType: string,
  navPropOdataName: string,
): NavPropDerivation {
  const owner = dataModel.getEntityType(ownerType);
  const navProp = owner && findProp(owner, navPropOdataName);
  if (!owner || !navProp) {
    return NOT_DERIVABLE;
  }

  // A contained navigation property has no entity set of its own to re-root at (CSDL §8.4), and one with
  // no entity set bound at all has no resource path a re-rooted key could ever use.
  if (navProp.contained) {
    return NOT_DERIVABLE;
  }
  const targetSet = dataModel.getNavPropBindingTarget(ownerType, navPropOdataName);
  if (!targetSet) {
    return NOT_DERIVABLE;
  }

  const rootType = targetSet.entityType.fqName;
  // The navigation property's own element type may be narrower than the entity set it is bound to, e.g.
  // `Publisher/Books` binds to the `Media` set (rooted at the abstract `Medium`) but only ever yields
  // `Book`s - the entity type carrying the inverse navigation property below is the narrower one.
  const elementType = dataModel.getEntityType(navProp.fqType);
  const elementTypeName = elementType?.fqName ?? navProp.fqType;
  const cast = elementTypeName !== rootType ? elementTypeName : undefined;

  if (navProp.isCollection) {
    // Grade A, to-many: the inverse navigation property - the one named by `partner` on the target
    // entity type - carries the constraint.
    const inverseProp = navProp.partner && elementType ? findProp(elementType, navProp.partner) : undefined;
    const constraints = inverseProp?.referentialConstraints;
    if (constraints?.length && constraints.every((c) => owner.keyNames.includes(c.referencedProperty))) {
      return {
        grade: "A",
        targetSet,
        rootType,
        cast,
        filterPairs: constraints.map((c) => ({ filterPath: c.property, parentKeyProperty: c.referencedProperty })),
      };
    }

    // Grade B: only the `Partner` is known, so the filter has to go through the inverse navigation path
    // itself - one clause per key property of the parent.
    if (navProp.partner) {
      return {
        grade: "B",
        targetSet,
        rootType,
        cast,
        filterPairs: owner.keyNames.map((keyProp) => ({
          filterPath: `${navProp.partner}/${keyProp}`,
          parentKeyProperty: keyProp,
        })),
      };
    }
  } else {
    // Grade A, to-one: the constraint sits on this navigation property itself rather than on an inverse,
    // and the result is a true canonical entity key rather than a filter.
    const constraints = navProp.referentialConstraints;
    if (constraints?.length && constraints.every((c) => owner.keyNames.includes(c.property))) {
      return {
        grade: "A",
        targetSet,
        rootType,
        cast,
        targetKeyPairs: constraints.map((c) => ({
          targetKeyProperty: c.referencedProperty,
          sourceKeyProperty: c.property,
        })),
      };
    }
  }

  return NOT_DERIVABLE;
}
