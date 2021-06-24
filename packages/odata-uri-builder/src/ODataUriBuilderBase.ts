import {
  QEntityCollectionPath,
  QEntityModel,
  QEntityPath,
  QExpression,
  QPropContainer,
} from "../../odata-query-objects/lib";
import { ExpandingODataUriBuilder } from "./internal";
import { ODataOperators } from "./internal";

export interface ODataUriBuilderConfig {
  unencoded?: boolean;
}

type EntityExtractor<T> = T extends QEntityPath<infer E> ? E : T extends QEntityCollectionPath<infer E> ? E : never;
type ExtractPropertyNamesOfType<T, S> = { [K in keyof T]: T[K] extends S ? K : never }[keyof T];

export abstract class ODataUriBuilderBase<T> {
  protected entity: QEntityModel<T, any>;

  protected unencoded: boolean;
  protected config?: ODataUriBuilderConfig;

  protected selects?: Array<string>;
  protected itemsToSkip?: number;
  protected itemsTop?: number;
  protected itemsCount?: boolean;
  protected expands: Array<ExpandingODataUriBuilder<any>> = [];
  protected filters: Array<QExpression> = [];

  protected constructor(qEntity: QEntityModel<T, any>, config?: ODataUriBuilderConfig) {
    if (!qEntity || !qEntity.entityName || !qEntity.entityName.trim()) {
      throw Error("A valid collection name must be provided!");
    }

    this.entity = qEntity;
    this.config = config;
    this.unencoded = !!config && !!config.unencoded;
  }

  public abstract build(): string;

  public select(...props: Array<keyof QPropContainer<T>>) {
    this.selects = props.map((p) => this.entity[p].getPath());
    return this;
  }

  public skip(itemsToSkip: number) {
    if (itemsToSkip === undefined || itemsToSkip === null || itemsToSkip < 0) {
      throw Error("Parameter [skip] must be a positive integer including 0!");
    }

    this.itemsToSkip = itemsToSkip;
    return this;
  }

  public top(itemsTop: number) {
    if (itemsTop === undefined || itemsTop === null || itemsTop < 0) {
      throw Error("Parameter [top] must be a positive integer including 0!");
    }

    this.itemsTop = itemsTop;
    return this;
  }

  public expanding<
    Prop extends ExtractPropertyNamesOfType<QEntityModel<T, any>, QEntityPath<any> | QEntityCollectionPath<any>>
  >(
    prop: Prop,
    builderFn: (
      builder: ExpandingODataUriBuilder<EntityExtractor<QEntityModel<T, any>[Prop]>>,
      qObject: QEntityModel<EntityExtractor<QEntityModel<T, any>[Prop]>, any>
    ) => void
  ) {
    const entity = (this.entity[prop] as QEntityPath<any>).getEntity();
    const expander = ExpandingODataUriBuilder.create(prop as string, entity);
    builderFn(expander, entity);

    this.expands.push(expander);

    return this;
  }

  public expand<
    Prop extends ExtractPropertyNamesOfType<QEntityModel<T, any>, QEntityPath<any> | QEntityCollectionPath<any>>
  >(...props: Array<Prop>) {
    this.expands.push(
      ...props.map((p) => {
        const prop = this.entity[p] as QEntityPath<any>;
        return ExpandingODataUriBuilder.create(p as string, prop.getEntity());
      })
    );
    return this;
  }

  protected param(operator: string, value: string) {
    return `${operator}=${value}`;
  }

  protected paramEncoded(operator: string, value: string) {
    return `${encodeURIComponent(operator)}=${encodeURIComponent(value)}`;
  }

  protected buildQuery(param: (operator: string, value: string) => string): Array<string> {
    const params: Array<string> = [];
    const add = (operator: string, value: string) => params.push(param(operator, value));

    if (this.selects) {
      add(ODataOperators.SELECT, this.selects?.join(","));
    }
    if (this.itemsToSkip !== undefined) {
      add(ODataOperators.SKIP, String(this.itemsToSkip));
    }
    if (this.itemsTop !== undefined) {
      add(ODataOperators.TOP, String(this.itemsTop));
    }
    if (this.itemsCount !== undefined) {
      add(ODataOperators.COUNT, String(this.itemsCount));
    }
    if (this.filters.length) {
      const filterConcat = this.filters.reduce((result, filter) => (result ? result.and(filter) : filter));
      add(ODataOperators.FILTER, filterConcat.toString());
    }
    if (this.expands.length) {
      const expand = this.expands.map((exp) => exp.build()).join(",");
      add(ODataOperators.EXPAND, expand);
    }

    return params;
  }

  public filter(...expressions: Array<QExpression>) {
    this.filters.push(...expressions);

    return this;
  }
}
