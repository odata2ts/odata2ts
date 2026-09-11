import { QId } from "../operation/QId";

/**
 * A batch request reference (OData V4.01 Part 1 §11.7.6) names a preceding sub-request of the same `$batch`
 * by its wire id, spelled `$<id>` - the token the `ref` helper in `odata-service` produces. It is not a key:
 * the service resolves it against that preceding sub-request's answer (its `Location`), so the client must
 * pass it through verbatim rather than assemble a key-predicate URL.
 *
 * odata2ts assigns the wire ids, and the token is the id wrapped in a `$`; the check mirrors that production
 * so a value only ever counts as a reference when it is exactly the token form a `ref` call yields.
 */
function isRequestReference(id: unknown): id is string {
  return typeof id === "string" && /^\$\d+$/.test(id);
}

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
   * @param cacheKeyEntitySetName the entity-set name as a cache key must carry it - the generator
   *                     supplies it, already prefixed, only where `cacheKeys.namespace` is on; absent
   *                     elsewhere, and exactly where it is, the raw name is the right one
   */
  constructor(
    private idFunctionFn: () => QId<Id>,
    private notation: BindingNotation = "4.0",
    private cacheKeyEntitySetName?: string,
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
   *
   * This is always the raw name: it is a real OData URL segment, and it stays the server's own name
   * wherever a {@link getCacheKeyEntitySetName cache-key name} carries a prefix this one must not.
   */
  public getEntitySetName(): string {
    return this.idFunctionFn().getName();
  }

  /**
   * The name of the entity set this binding's target belongs to, as a cache key must carry it - the
   * {@link getEntitySetName raw name} unless the generator supplied a prefixed one, which it does only
   * under `cacheKeys.namespace` (the generator's own prefix rule, not re-derived here). Cache-key
   * identity and URL building are different channels: everything that ends up in a URL keeps reading
   * {@link getEntitySetName}, everything that ends up in a cache key reads this.
   */
  public getCacheKeyEntitySetName(): string {
    return this.cacheKeyEntitySetName ?? this.idFunctionFn().getName();
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
   *
   * A batch request reference (`$<id>`) is the one value this is not: it names a preceding sub-request, not an
   * entity by key, so it goes out verbatim and the service - not the id function - resolves it.
   */
  public format(id: Id | string): unknown {
    const url = isRequestReference(id) ? id : this.idFunctionFn().buildUrl(id);

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
