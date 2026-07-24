import { describe, expect, test } from "vitest";
import { NoopFormatter } from "../../../src/project/formatter/NoopFormatter.js";

describe("NoopFormatter tests", () => {
  test("init resolves to itself", async () => {
    const formatter = new NoopFormatter("./test.ts");

    expect(await formatter.init()).toBe(formatter);
  });

  test("format returns the source unchanged", async () => {
    const formatter = new NoopFormatter("./test.ts");
    const source = "const x = 1;";

    expect(await formatter.format(source)).toBe(source);
  });
});
