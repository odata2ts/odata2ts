import { ValueConverter } from "@odata2ts/converter-api";
import { QBinding } from "./QBinding";

export interface QPathModel {
  getPath(): string;
}

export interface QValuePathModel extends QPathModel {
  converter?: ValueConverter<any, any>;
}

export interface QEntityPathModel<Q> extends QPathModel {
  getEntity(withPrefix?: boolean): Q;
  isCollectionType(): boolean;
  /**
   * The binding of this navigation property, if it points at an entity set which is known from the
   * metadata and the client was generated with binding props enabled. Only then a key can be turned into
   * the URL a binding is made of.
   */
  getBinding?(): QBinding<any> | undefined;
}
