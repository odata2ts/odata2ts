import { QFunction, QParam } from "../../../src";

export class QGetSomethingFunction extends QFunction {
  constructor(path: string) {
    super(path, "getSomething");
  }

  public getParams(): Record<string, QParam<any>> {
    return {};
  }

  public buildUrl(): string {
    return this.formatUrl(undefined);
  }
}

export class QGetSomethingFunctionV2 extends QFunction {
  constructor(path: string) {
    super(path, "getSomething", true);
  }

  public getParams() {
    return undefined;
  }

  public buildUrl(): string {
    return this.formatUrl(undefined);
  }
}
