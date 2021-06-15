import { ODataOperators } from "./ODataModel";

export interface ODataUriBuilderConfig {
  unencoded?: boolean;
}

export class ODataUriBuilder<T> {
  private collection: string;
  private unencoded: boolean;

  private selects?: Array<keyof T>;
  private itemsToSkip?: number;
  private itemsTop?: number;
  private itemsCount?: boolean;
  private expands: Array<ODataUriBuilder<any>> = [];

  constructor(collection: string, config?: ODataUriBuilderConfig) {
    if (!collection || !collection.trim()) {
      throw Error("A valid collection name must be supplied in [from] clause!");
    }

    this.collection = collection;
    this.unencoded = !!config && !!config.unencoded;
    return this;
  }

  public select(...props: Array<keyof T>) {
    this.selects = props;
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

  public count(doCount?: boolean) {
    this.itemsCount = doCount === undefined || doCount;
    return this;
  }

  public expanding<P>(prop: keyof T, builder: (builder: ODataUriBuilder<P>) => void): ODataUriBuilder<T> {
    const expander = new ODataUriBuilder<P>(prop as string);
    builder(expander);

    this.expands.push(expander);

    return this;
  }

  public expand(...props: Array<keyof T>) {
    this.expands.push(
      ...props.map((p) => {
        return new ODataUriBuilder(p as string);
      })
    );
    return this;
  }

  protected buildAsExpansion(): string {
    const params = this.buildQuery(this.param);

    return this.collection + (params.length ? `(${params.join(";")})` : "");
  }

  public build(): string {
    const paramFn = this.unencoded ? this.param : this.paramEncoded;
    const params = this.buildQuery(paramFn);

    return "/" + this.collection + (params.length ? `?${params.join("&")}` : "");
  }

  private param(operator: string, value: string) {
    return `${operator}=${value}`;
  }

  private paramEncoded(operator: string, value: string) {
    return `${encodeURIComponent(operator)}=${encodeURIComponent(value)}`;
  }

  private buildQuery(param: (operator: string, value: string) => string): Array<string> {
    const params: Array<string> = [];
    const add = (operator: string, value: string) => params.push(param(operator, value));

    if (this.selects) {
      // url.addQuery(ODataOperators.SELECT, this.selects?.join(","));
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
    if (this.expands.length) {
      const expand = this.expands.map((exp) => exp.buildAsExpansion()).join(",");
      add(ODataOperators.EXPAND, expand);
    }

    return params;
  }
}
