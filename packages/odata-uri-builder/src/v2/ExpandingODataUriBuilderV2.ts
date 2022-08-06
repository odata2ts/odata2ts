import { QueryObject } from "@odata2ts/odata-query-objects";
import { ExpandingODataUriBuilderV2Model, ExpandType } from "../ODataUriBuilderModel";
import { ODataUriBuilder } from "../ODataUriBuilder";
import { ExpandingODataUriBuilderV4 } from "../v4/ExpandingODataUriBuilderV4";

/**
 * Builder for expanded entities or entity collections.
 */
export class ExpandingODataUriBuilderV2<Q extends QueryObject> implements ExpandingODataUriBuilderV2Model<Q> {
  public static create<Q extends QueryObject>(property: string, qEntity: Q /*, config?: ODataUriBuilderConfig*/) {
    // must never be encoded, since it is part of $expand
    return new ExpandingODataUriBuilderV2<Q>(property, qEntity);
  }

  private builder: ODataUriBuilder<Q>;

  public constructor(property: string, qEntity: Q) {
    this.builder = new ODataUriBuilder(property, qEntity, { expandingBuilder: true });
  }

  public select(...props: Array<keyof Q | null | undefined>) {
    this.builder.select(props);
    return this;
  }

  public expand<Prop extends ExpandType<Q>>(...props: Array<Prop>) {
    this.builder.expand(ExpandingODataUriBuilderV4, props);
    return this;
  }

  /**
   * Build the final URI string for this expanded entity or entity collection.
   * This method is called internally.
   *
   * @returns the query string for this expanded entity or entity collection
   */
  public build(): string {
    return this.builder.build();
    // const params = this.buildQuery(this.param);
    //
    // return this.path + (params.length ? `(${params.join(";")})` : "");
  }
}
