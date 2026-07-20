import { describe, expect, test } from "vitest";
import { filterIn } from "../../../src/path/base/BaseFunctions";

describe("BaseFunctions: filterIn tests", () => {
  const mapValue = (value: string) => `'${value}'`;

  test("filterIn: single value", () => {
    const result = filterIn("name", mapValue)("Horst");

    expect(result.toString()).toBe("name in ('Horst')");
  });

  test("filterIn: multiple values, including a nested array", () => {
    const result = filterIn("name", mapValue)("Horst", ["Kai", "Zebra"]);

    expect(result.toString()).toBe("name in ('Horst','Kai','Zebra')");
  });
});
