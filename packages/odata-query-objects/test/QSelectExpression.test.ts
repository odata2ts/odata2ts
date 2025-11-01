import { describe, expect, test } from "vitest";
import { QSelectExpression } from "../src";

describe("QSelectExpression test", () => {
  test("handling empty, null, undefined", () => {
    // @ts-ignore
    expect(new QSelectExpression(null).toString()).toBe("");
    expect(new QSelectExpression().toString()).toBe("");
    expect(new QSelectExpression(undefined).toString()).toBe("");
    expect(new QSelectExpression("    ").toString()).toBe("");
    expect(new QSelectExpression("").toString()).toBe("");
  });

  test("get path", () => {
    const expected = "toTesT";
    const candidate = new QSelectExpression(expected);

    expect(candidate.getPath()).toBe(expected);
  });
});
