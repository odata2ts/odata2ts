import { describe, expect, test } from "vitest";
import { ref } from "../src";

describe("ref", () => {
  test("builds the request-reference token $<id> from a wire id", () => {
    expect(ref(1)).toBe("$1");
    expect(ref(42)).toBe("$42");
  });
});
