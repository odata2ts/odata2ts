import { QComplexPath, QPath, QueryObject } from "@odata2ts/odata-query-objects";
import { ExpandType, ODataOperators, ODataUriBuilder, ODataUriBuilderBase, ODataUriBuilderConfig } from "../internal";

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
   * Select the properties of the entity you want to select.
   *
   * @param props the property names to select
   * @returns this query builder
   */
  public select(...props: Array<keyof Q | null | undefined>) {
    if (props && props.length) {
      this.selects.push(
        ...props
          .filter((p): p is keyof Q => !!p)
          .map((p) => {
            return (this.entity[p] as unknown as QPath).getPath();
          })
      );
    }
    return this;
  }

  /**
   * Expand a given entity and receive an own builder for it to further select, filter, expand, etc.
   *
   * This method can be called multiple times.
   *
   * Example:
   * .expanding("addresses", (addressBuilder, qAddress) => {
   *   addressBuilder
   *     .select(...)
   *     .filter(qAddress.street.startsWith(...))
   * })
   *
   * @param prop the name of the property which should be expanded
   * @param builderFn function which receives an entity specific builder as first & the appropriate query object as second argument
   * @returns this query builder
   */
  /*public expanding<Prop extends ExpandType<Q>>(
    prop: Prop,
    builderFn: (builder: ExpandingODataUriBuilder<EntityExtractor<Q[Prop]>>, qObject: EntityExtractor<Q[Prop]>) => void
  ) {
    const entityProp = this.entity[prop] as unknown as QComplexPath;
    const expander = ExpandingODataUriBuilder.create(entityProp.getPath(), entityProp.getEntity());
    builderFn(expander, entityProp.getEntity());

    this.expands.push(expander);

    return this;
  }*/

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
}
