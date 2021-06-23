import { QEntityModel, QStringPath } from "@odata2ts/odata-query-objects";
import { ODataUriBuilderBase, ODataUriBuilderConfig } from "./internal";

export class ODataUriBuilder<T, K extends keyof T> extends ODataUriBuilderBase<T> {
  static create<T, K extends keyof T>(qEntity: QEntityModel<T, K>, config?: ODataUriBuilderConfig) {
    if (!qEntity || !qEntity.entityName || !qEntity.entityName.trim()) {
      throw Error("QEntity must be supplied with a valid entityName!");
    }

    return new ODataUriBuilder<T, K>(qEntity, config);
  }

  protected readonly entity: QEntityModel<T, K>;
  private key?: string;

  private constructor(qEntity: QEntityModel<T, K>, config?: ODataUriBuilderConfig) {
    super(qEntity, config);
    this.entity = qEntity;
  }

  public byKey(keys: { [Key in K]: T[Key] }) {
    this.key = Object.entries<T[K]>(keys)
      .map(([key, value]) => {
        const prop = this.entity[key as K];
        const val = prop && prop instanceof QStringPath ? `'${value}'` : value;
        return key + "=" + val;
      })
      .join(",");

    return this;
  }

  public count(doCount?: boolean) {
    this.itemsCount = doCount === undefined || doCount;
    return this;
  }

  public build(): string {
    const paramFn = this.unencoded ? this.param : this.paramEncoded;
    const params = this.buildQuery(paramFn);
    const collection = this.entity.entityName + (this.key ? `(${this.key})` : "");

    return "/" + collection + (params.length ? `?${params.join("&")}` : "");
  }
}
