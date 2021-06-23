import { QEntityModel } from "@odata2ts/odata-query-objects";
import { ODataUriBuilderBase, ODataUriBuilderConfig } from "./internal";

export class ExpandingODataUriBuilder<T> extends ODataUriBuilderBase<T> {
  public static create<T>(property: string, qEntity: QEntityModel<T, any>, config?: ODataUriBuilderConfig) {
    return new ExpandingODataUriBuilder<T>(property, qEntity, config);
  }

  private constructor(private property: string, qEntity: QEntityModel<T, any>, config?: ODataUriBuilderConfig) {
    super(qEntity, config);
  }

  public build(): string {
    const params = this.buildQuery(this.param);

    return this.property + (params.length ? `(${params.join(";")})` : "");
  }
}
