import { UrlParamValueFormatter, UrlParamValueParser } from "../internal";

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
