import { QComplexPath, QueryObject } from "@odata2ts/odata-query-objects";
import { EntityExtractor, ExpandingODataUriBuilderV2Model, ExpandType } from "../ODataUriBuilderModel";
import { ODataUriBuilder } from "../ODataUriBuilder";

export function createExpandingUriBuilderV2<Q extends QueryObject>(
  property: string,
  qEntity: Q
): ExpandingODataUriBuilderV2Model<Q> {
  // must never be encoded, since it is part of $expand
  return new ExpandingODataUriBuilderV2<Q>(property, qEntity);
}

/**
 * Builder for expanded entities or entity collections.
 */
class ExpandingODataUriBuilderV2<Q extends QueryObject> implements ExpandingODataUriBuilderV2Model<Q> {
  private selects = new Set<string>();
  private expands = new Set<string>();

  private builder: ODataUriBuilder<Q>;

  constructor(property: string, qEntity: Q) {
    this.builder = new ODataUriBuilder(property, qEntity, { expandingBuilder: true });
    this.expands.add(property);
  }

  private getPrefixedPath = (path: string) => `${this.builder.getPath()}/${path}`;

  private getPrefixedPathForProp = (prop: keyof Q) => {
    const path = this.builder.getEntityProp(prop).getPath();
    return this.getPrefixedPath(path);
  };

  public select(...props: Array<keyof Q | null | undefined>) {
    const filtered = props?.filter((p): p is keyof Q => !!p);
    if (filtered?.length) {
      filtered.map(this.getPrefixedPathForProp).forEach((path) => {
        this.selects.add(path);
      });
    }

    return this;
  }

  public expand<Prop extends ExpandType<Q>>(...props: Array<Prop>) {
    const filtered = props?.filter((p): p is NonNullable<Prop> => !!p);
    if (filtered?.length) {
      filtered.map(this.getPrefixedPathForProp).forEach((path) => {
        this.expands.add(path);
      });
    }

    return this;
  }

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
      selects.map(this.getPrefixedPath).forEach((s) => this.selects.add(s));
    }
    if (expands?.length) {
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
