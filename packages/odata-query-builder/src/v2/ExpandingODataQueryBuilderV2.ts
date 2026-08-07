import { QEntityPathModel, QFlatComplexPath, QSelectExpression, QueryObjectModel } from "@odata2ts/odata-query-objects";
import { ODataQueryBuilder } from "../ODataQueryBuilder";
import {
  EntityExtractor,
  ExpandingFunctionV2,
  ExpandingQueryBuilderV2 as ExpandingODataQueryBuilderV2Model,
  NestingType,
  NullableParamList,
  SelectType,
} from "../ODataQueryBuilderModel";

export function createExpandingQueryBuilderV2<Q extends QueryObjectModel>(
  property: string,
  qEntity: Q,
  flat: boolean = false,
): ExpandingODataQueryBuilderV2Model<Q> {
  // must never be encoded, since it is part of $expand
  return new ExpandingODataQueryBuilderV2<Q>(property, qEntity, flat);
}

/**
 * Builder for expanded entities or entity collections.
 */
class ExpandingODataQueryBuilderV2<Q extends QueryObjectModel> implements ExpandingODataQueryBuilderV2Model<Q> {
  private selects = new Set<string>();
  private expands = new Set<string>();

  private builder: ODataQueryBuilder<Q>;

  /**
   * @param flat whether `property` is a complex property the service states flat. There is then nothing to
   *   expand - the service knows no property of that name, only its leaves - and the query object handed in
   *   already carries the prefix, so its paths need none of their own.
   */
  constructor(
    property: string,
    qEntity: Q,
    private flat: boolean = false,
  ) {
    this.builder = new ODataQueryBuilder(property, qEntity, { expandingBuilder: true });
    if (!flat) {
      this.expands.add(property);
    }
  }

  private getPrefixedPath = (path: string) => (this.flat ? path : `${this.builder.getPath()}/${path}`);

  public select(...props: NullableParamList<SelectType<Q>>) {
    const filtered = this.builder.filterSelectAndMapPath(props);
    if (filtered.length) {
      filtered.forEach((path) => {
        this.selects.add(this.getPrefixedPath(path));
      });
    }

    return this;
  }

  public expand<Prop extends NestingType<Q>>(...props: NullableParamList<Prop | QSelectExpression>) {
    const filtered = this.builder.filterSelectAndMapPath(props);
    if (filtered.length) {
      filtered.forEach((path) => {
        this.expands.add(this.getPrefixedPath(path));
      });
    }

    return this;
  }

  public expanding<Prop extends NestingType<Q>>(prop: Prop, builderFn: ExpandingFunctionV2<Q[Prop]>) {
    if (!builderFn) {
      return this;
    }

    const entityProp = this.builder.getEntityProp<QEntityPathModel<any>>(prop);
    const isFlat = entityProp instanceof QFlatComplexPath;
    const entity = entityProp.getEntity(isFlat);
    const expander = new ExpandingODataQueryBuilderV2<EntityExtractor<Q[Prop]>>(entityProp.getPath(), entity, isFlat);

    builderFn(expander, entity);

    const { selects, expands } = expander.build();
    if (selects.length) {
      selects.map(this.getPrefixedPath).forEach((s) => this.selects.add(s));
    }
    if (expands.length) {
      expands.map(this.getPrefixedPath).forEach((e) => this.expands.add(e));
    }

    return this;
  }

  public build() {
    const { selects, expands } = this;
    return {
      selects: [...selects],
      expands: [...expands],
    };
  }
}
