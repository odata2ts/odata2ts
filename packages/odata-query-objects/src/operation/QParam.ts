import { UrlParamValueFormatter, UrlParamValueParser } from "../param/UrlParamModel";

export enum QParamTypesV2 {
  Guid,
  Boolean,
  String,
  Number,
  Time,
  DateTime,
  DateTimeOffset,
  // Binary,
}

export enum QParamTypes {
  Guid,
  Boolean,
  String,
  Number,
  TimeOfDay,
  Date,
  DateTimeOffset,
  // Duration,
  // Binary,
}

export abstract class QParam<Type extends string | number | boolean> {
  constructor(protected name: string) {
    if (!name) {
      throw new Error("Name is required for QParam objects!");
    }
  }

  public getName() {
    return this.name;
  }

  public abstract formatUrlValue: UrlParamValueFormatter<Type>;

  public abstract parseUrlValue: UrlParamValueParser<Type>;
}
