import { QFunctionV2, QFunctionV4 } from "../../../src";

export class QGetSomethingFunction extends QFunctionV4<undefined, void> {
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

export class QGetSomethingFunctionV2 extends QFunctionV2<undefined, void> {
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
