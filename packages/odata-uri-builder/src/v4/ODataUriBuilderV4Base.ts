import { QComplexPath, QPath, QueryObject } from "@odata2ts/odata-query-objects";
import {
  EntityExtractor,
  ExpandingODataUriBuilder,
  ExpandType,
  ODataOperators,
  ODataUriBuilder,
  ODataUriBuilderBase,
} from "../internal";

export abstract class ODataUriBuilderV4Base<Q extends QueryObject>
  extends ODataUriBuilderBase<Q>
  implements ODataUriBuilder<Q>
{
  protected selects: Array<string> = [];
  protected expands: Array<ExpandingODataUriBuilder<any>> = [];
  protected groupBys: Array<string> = [];
  protected searchTerm: string | undefined;

  protected getSelectResult() {
    return this.selects.length ? this.selects.join(",") : undefined;
  }

  protected getExpandResult(): string | undefined {
    return this.expands.length ? this.expands.map((exp) => exp.build()).join(",") : undefined;
  }

  protected getCountResult(): [string, string] | undefined {
    return this.itemsCount !== undefined ? [ODataOperators.COUNT, String(this.itemsCount)] : undefined;
  }

  protected getGroupByResult(): string | undefined {
    return this.groupBys.length ? `groupby((${this.groupBys.join(",")}))` : undefined;
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
  public expanding<Prop extends ExpandType<Q>>(
    prop: Prop,
    builderFn: (builder: ExpandingODataUriBuilder<EntityExtractor<Q[Prop]>>, qObject: EntityExtractor<Q[Prop]>) => void
  ) {
    const entityProp = this.entity[prop] as unknown as QComplexPath;
    const expander = ExpandingODataUriBuilder.create(entityProp.getPath(), entityProp.getEntity());
    builderFn(expander, entityProp.getEntity());

    this.expands.push(expander);

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
        return ExpandingODataUriBuilder.create(prop.getPath(), prop.getEntity());
      })
    );
    return this;
  }
}
