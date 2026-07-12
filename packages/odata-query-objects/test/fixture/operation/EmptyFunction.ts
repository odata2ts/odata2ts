import { QFunction } from "../../../src";

export class QGetSomethingFunction extends QFunction<undefined, void> {
  constructor() {
    super("getSomething");
  }

  public getParams() {
    return [];
  }

  public buildUrl() {
    return super.buildUrl(undefined);
  }
}

export class QGetSomethingFunctionV2 extends QFunction<undefined, void> {
  constructor() {
    super("getSomething", undefined, { v2Mode: true });
  }

  public getParams() {
    return [];
  }

  public buildUrl() {
    return super.buildUrl(undefined);
  }
}
