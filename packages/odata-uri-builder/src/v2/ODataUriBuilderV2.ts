import { QComplexPath, QFilterExpression, QOrderByExpression, QueryObject } from "@odata2ts/odata-query-objects";
import {
  EntityExtractor,
  ExpandType,
  ODataOperators,
  ODataUriBuilder,
  ODataUriBuilderConfig,
  ODataUriBuilderV2Model,
} from "../internal";
import { ExpandingODataUriBuilderV2 } from "./ExpandingODataUriBuilderV2";

/**
 * Create an OData URI string in a typesafe way by facilitating generated query objects.
 */
export class ODataUriBuilderV2<Q extends QueryObject> implements ODataUriBuilderV2Model<Q> {
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

  private builder: ODataUriBuilder<Q>;

  private constructor(path: string, qEntity: Q, config?: ODataUriBuilderConfig) {
    this.builder = new ODataUriBuilder(path, qEntity, config);
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
   * Examples:
   * - {@code select("lastName", "firstName", undefined) } => $select=lastName,firstName
   * - {@code select("lastName", false ? "firstName" : undefined) } => $select=lastName
   *
   * @param props the property names to select or a function to select one or more QPathModels from QueryObject
   * @returns this query builder
   */
  public select(...props: Array<keyof Q | null | undefined>) {
    this.builder.select(props);
    return this;
  }

  public filter(...expressions: Array<QFilterExpression>) {
    this.builder.filter(expressions);
    return this;
  }

  public expand<Prop extends ExpandType<Q>>(...props: Array<Prop>) {
    this.builder.expand(props);
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
   * @param builderFn function which receives the query object as argument
   * @returns this query builder
   */
  public expanding<Prop extends ExpandType<Q>>(
    prop: Prop,
    builderFn: (
      builder: ExpandingODataUriBuilderV2<EntityExtractor<Q[Prop]>>,
      qObject: EntityExtractor<Q[Prop]>
    ) => void
  ) {
    const entityProp = this.builder.getEntityProp<QComplexPath>(prop);
    const entity = entityProp.getEntity();

    const expander = new ExpandingODataUriBuilderV2(entityProp.getPath(), entity);

    builderFn(expander, entity);

    const { selects, expands } = expander.build();
    if (selects?.length) {
      this.builder.addSelects(...selects);
    }
    if (expands?.length) {
      this.builder.addExpands(...expands);
    }

    return this;
  }

  public orderBy(...expressions: Array<QOrderByExpression>) {
    this.builder.orderBy(expressions);
    return this;
  }

  public count(doCount?: boolean) {
    if (doCount === undefined || doCount) {
      this.builder.count(ODataOperators.COUNTV2, "allpages");
    }
    return this;
  }

  public top(itemsTop: number) {
    this.builder.top(itemsTop);
    return this;
  }

  public skip(itemsToSkip: number) {
    this.builder.skip(itemsToSkip);
    return this;
  }

  public build() {
    return this.builder.build();
  }
}
