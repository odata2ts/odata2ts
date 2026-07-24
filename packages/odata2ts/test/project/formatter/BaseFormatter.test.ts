import { describe, expect, test } from "vitest";
import { BaseFormatter } from "../../../src/project/formatter/BaseFormatter.js";

class TestFormatter extends BaseFormatter {
  public async init(): Promise<BaseFormatter> {
    this.settings = { useTrailingCommas: true };
    return this;
  }

  public async format(source: string): Promise<string> {
    return source;
  }
}

describe("BaseFormatter tests", () => {
  test("getSettings returns settings populated by init()", async () => {
    const formatter = new TestFormatter("./test.ts");
    await formatter.init();

    expect(formatter.getSettings()).toStrictEqual({ useTrailingCommas: true });
  });
});
