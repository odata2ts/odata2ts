import { describe, expect, test } from "vitest";
import { QSelectExpression } from "../src";

describe("QSelectExpression test", () => {
  test("handling empty, null, undefined", () => {
    // @ts-ignore
    expect(new QSelectExpression(null).getPath()).toBe("");
    expect(new QSelectExpression().getPath()).toBe("");
    expect(new QSelectExpression(undefined).getPath()).toBe("");
    expect(new QSelectExpression("    ").getPath()).toBe("");
    expect(new QSelectExpression("").getPath()).toBe("");
  });

  test("get path", () => {
    const expected = "toTesT";
    const candidate = new QSelectExpression(expected);

    expect(candidate.getPath()).toBe(expected);
  });
});
