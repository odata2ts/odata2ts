import {
  QComplexPath,
  QEntityCollectionPath,
  QEntityPath,
  QPathModel,
  QueryObject,
} from "@odata2ts/odata-query-objects";
import {
  EntityExtractor,
  ExpandType,
  ODataOperators,
  ODataUriBuilder,
  ODataUriBuilderBase,
  ODataUriBuilderConfig,
} from "../internal";

/**
 * Create an OData URI string in a typesafe way by facilitating generated query objects.
 */
export class ODataUriBuilderV2<Q extends QueryObject> extends ODataUriBuilderBase<Q> implements ODataUriBuilder<Q> {
  /**
   * Create an UriBuilder by passing in a query object, which already contains the base path
   * to the OData service & the given entity.
   *
   * Example:
   * ODataUriBuilder.create("people", qPerson)
   *   .select(...)
   *   .filter(qPerson.age.greaterThan(...))
   *   ...
   *   .build()
   *
   * @param path base path to
   * @param qEntity the query object
   * @param config optionally pass a configuration
   * @returns a UriBuilder
   */
  static create<Q extends QueryObject>(path: string, qEntity: Q, config?: ODataUriBuilderConfig) {
    return new ODataUriBuilderV2<Q>(path, qEntity, config);
  }

  protected selects: Array<string> = [];
  protected expands: Array<string> = [];

  protected getSelectResult(): string | undefined {
    return this.selects.length ? this.selects.join(",") : undefined;
  }
  protected getExpandResult(): string | undefined {
    return this.expands.length ? this.expands.join(",") : undefined;
  }
  protected getCountResult(): [string, string] | undefined {
    return this.itemsCount ? [ODataOperators.COUNTV2, "allpages"] : undefined;
  }

  protected getGroupByResult(): string | undefined {
    return undefined;
  }

  protected getSearchResult(): string | undefined {
    return undefined;
  }

  /**
   * Add the count to the response.
   *
   * @param doCount explicitly specify if counting should be done
   * @returns this query builder
   */
  public count(doCount?: boolean) {
    this.itemsCount = doCount === undefined || doCount;
    return this;
  }

  /**
   * Name the properties of the entity you want to select.
   * Null or undefined are allowed and will be ignored.
   *
   * This function can be called multiple times.
   *
   * If you want to select nested properties, e.g. "address/street", then you need to use a function.
   * The first parameter of the function will be the current QueryObject of the UriBuilder.
   *
   * Examples for a PersonModel:
   * - {@code select("lastName", null, "firstName")} => $select=lastName,firstName
   * - {@code select((qPerson) => qPerson.address.props.street) } => $select=address/street
   * - {@code select((qPerson) => [qPerson.address.props.street, qPerson.lastName]) } => $select=address/street,lastName
   *
   * @param props the property names to select or a function to select one or more QPathModels from QueryObject
   * @returns this query builder
   */
  public select(...props: Array<keyof Q | null | undefined | QPathModel>) {
    if (props && props.length) {
      for (let p of props) {
        if (!p) {
          continue;
        }

        if (typeof p === "object" && typeof p.getPath === "function") {
          this.selects.push(p.getPath());
        } else {
          // @ts-ignore
          const prop = this.entity[p] as QPathModel;
          this.selects.push(prop.getPath());
        }
      }
    }
    return this;
  }

  /**
   * Simple & plain expand of the given entities or entity collections.
   *
   * This method can be called multiple times.
   *
   * @param props the attributes to expand
   * @returns this query builder
   */
  public expand<Prop extends ExpandType<Q>>(...props: Array<Prop>) {
    this.expands.push(
      ...props.map((p) => {
        const prop = this.entity[p] as unknown as QComplexPath;
        // return ExpandingODataUriBuilder.create(prop.getPath(), prop.getEntity());
        return prop.getPath();
      })
    );
    return this;
  }

  /**
   * Expand nested props of the current entity.
   *
   * This method can be called multiple times.
   *
   * Examples for a PersonModel:
   * - {@code expanding("address", (qAddress) => qAddress.responsible) // result: $expand=address/responsible}
   * - {@code expanding("address", (qAddress) => qAddress.responsible.props.address) // result: $expand=address/responsible/address}
   *
   * @param prop name of the property to expand
   * @param expandFn function which receives the query object as argument
   * @returns this query builder
   */
  public expanding<Prop extends ExpandType<Q>>(
    prop: Prop,
    expandFn: (q: EntityExtractor<Q[Prop]>) => QEntityPath<any> | QEntityCollectionPath<any>
  ) {
    const entityProp = this.entity[prop] as unknown as QComplexPath;
    const ePath = expandFn(entityProp.getEntity(true));
    this.expands.push(ePath.getPath());

    return this;
  }
}
