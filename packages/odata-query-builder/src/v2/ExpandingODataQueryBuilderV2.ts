import { QEntityPath, QueryObject } from "@odata2ts/odata-query-objects";

import { ODataQueryBuilder } from "../ODataQueryBuilder";
import {
  EntityExtractor,
  ExpandType,
  ExpandingFunctionV2,
  ExpandingODataQueryBuilderV2 as ExpandingODataQueryBuilderV2Model,
  NullableParamList,
} from "../ODataQueryBuilderModel";

export function createExpandingQueryBuilderV2<Q extends QueryObject>(
  property: string,
  qEntity: Q
): ExpandingODataQueryBuilderV2Model<Q> {
  // must never be encoded, since it is part of $expand
  return new ExpandingODataQueryBuilderV2<Q>(property, qEntity);
}

/**
 * Builder for expanded entities or entity collections.
 */
class ExpandingODataQueryBuilderV2<Q extends QueryObject> implements ExpandingODataQueryBuilderV2Model<Q> {
  private selects = new Set<string>();
  private expands = new Set<string>();

  private builder: ODataQueryBuilder<Q>;

  constructor(property: string, qEntity: Q) {
    this.builder = new ODataQueryBuilder(property, qEntity, { expandingBuilder: true });
    this.expands.add(property);
  }

  private getPrefixedPath = (path: string) => `${this.builder.getPath()}/${path}`;

  private getPrefixedPathForProp = (prop: keyof Q) => {
    const path = this.builder.getEntityProp(prop).getPath();
    return this.getPrefixedPath(path);
  };

  public select(...props: NullableParamList<keyof Q>) {
    const filtered = props.filter((p): p is keyof Q => !!p);
    if (filtered.length) {
      filtered.map(this.getPrefixedPathForProp).forEach((path) => {
        this.selects.add(path);
      });
    }

    return this;
  }

  public expand<Prop extends ExpandType<Q>>(...props: NullableParamList<Prop>) {
    const filtered = props.filter((p): p is NonNullable<Prop> => !!p);
    if (filtered.length) {
      filtered.map(this.getPrefixedPathForProp).forEach((path) => {
        this.expands.add(path);
      });
    }

    return this;
  }

  public expanding<Prop extends ExpandType<Q>>(prop: Prop, builderFn: ExpandingFunctionV2<Q[Prop]>) {
    if (!builderFn) {
      return this;
    }

    const entityProp = this.builder.getEntityProp<QEntityPath<any>>(prop);
    const entity = entityProp.getEntity();
    const expander = new ExpandingODataQueryBuilderV2<EntityExtractor<Q[Prop]>>(entityProp.getPath(), entity);

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
