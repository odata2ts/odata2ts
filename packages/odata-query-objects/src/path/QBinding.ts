import { QId } from "../operation/QId";

/**
 * How a binding to an already existing entity is spelled in a request payload.
 *
 * - {@code 4.0} keeps the binding apart from the payload: {@code "Location@odata.bind": "Branches(1)"}
 * - {@code 4.01} states it inline, by the very name of the navigation property: {@code "Location": {"@id": "Branches(1)"}}
 * - {@code V2} does the same, in the notation of its own: {@code "Location": {"__metadata": {"uri": "Branches(1)"}}}
 */
export type BindingNotation = "V2" | "4.0" | "4.01";

/**
 * Turns the key of an entity into the binding notation of the targeted OData version.
 *
 * The user facing models state a binding by key ({@code {"@id": 1}}), since the key is what the user has at
 * hand - the URL of the entity is something they would have to assemble themselves. That URL is built here,
 * by the id function of the entity set the navigation property points to, which is known from the
 * NavigationPropertyBinding (V4) or the AssociationSet (V2) of the metadata.
 *
 * The URL is relative to the service root, which is what the spec asks for and what spares this object any
 * knowledge about the actual service location.
 */
export class QBinding<Id> {
  /**
   * @param idFunctionFn returns the id function of the *target* entity set; a factory, so that a query
   *                     object and the id function of the entity it points to may live in the same module
   * @param notation the spelling of the targeted OData version
   */
  constructor(
    private idFunctionFn: () => QId<Id>,
    private notation: BindingNotation = "4.0",
  ) {
    if (!idFunctionFn || typeof idFunctionFn !== "function") {
      throw new Error("Function which returns the id function must be supplied!");
    }
  }

  public getNotation(): BindingNotation {
    return this.notation;
  }

  /**
   * The name of the entity set this binding's target belongs to - the same name {@link format} already
   * builds every URL from, exposed on its own for a caller after the resource's identity rather than a URL.
   */
  public getEntitySetName(): string {
    return this.idFunctionFn().getName();
  }

  /**
   * The target's own canonical id - entity-set name plus key predicate, e.g. `Copies(3)` or
   * `Copies(Id=1,Category='books')` - built from the very same id function {@link format} uses, but without
   * the notation-specific wrapping a binding property value needs. See {@link QId.buildCanonicalId} for the
   * shapes `entity` may take.
   */
  public buildCanonicalId(entity: unknown): string | undefined {
    return this.idFunctionFn().buildCanonicalId(entity);
  }

  /**
   * The property name the binding goes by, which is the navigation property itself in every version but
   * 4.0 - meaning that in those versions a binding and a deep insert share one property.
   */
  public getKey(odataPropName: string): string {
    return this.notation === "4.0" ? `${odataPropName}@odata.bind` : odataPropName;
  }

  /**
   * The value of the binding property: the URL of the referenced entity, wrapped as the notation demands.
   */
  public format(id: Id): unknown {
    const url = this.idFunctionFn().buildUrl(id);

    switch (this.notation) {
      case "V2":
        return { __metadata: { uri: url } };
      case "4.01":
        return { "@id": url };
      default:
        return url;
    }
  }
}
