import { QFunction } from "../../../src";

export class QGetSomethingFunction extends QFunction {
  constructor(path: string) {
    super(path, "getSomething");
  }

  public getParams() {
    return undefined;
  }

  public buildUrl() {
    return super.buildUrl(undefined);
  }
}

export class QGetSomethingFunctionV2 extends QFunction {
  constructor(path: string) {
    super(path, "getSomething", true);
  }

  public getParams() {
    return undefined;
  }

  public buildUrl() {
    return super.buildUrl(undefined);
  }
}
