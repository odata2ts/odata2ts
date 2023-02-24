import { ValueConverter } from "@odata2ts/converter-api";

export interface QPathModel {
  getPath(): string;
}

export interface QValuePathModel extends QPathModel {
  converter?: ValueConverter<any, any>;
}

export interface QEntityPathModel<Q> extends QPathModel {
  getEntity(withPrefix?: boolean): Q;
  isCollectionType(): boolean;
}
