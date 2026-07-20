import { describe, expect, test } from "vitest";
import { processCliArgs } from "../../src/cli/processCliArgs";

describe("processCliArgs tests", () => {
  const BASE_ARGV = ["node", "cli.js"];

  test("no positional services given", () => {
    const result = processCliArgs(BASE_ARGV);

    expect(result.services).toBeUndefined();
  });

  test("positional services are collected", () => {
    const result = processCliArgs([...BASE_ARGV, "serviceA", "serviceB"]);

    expect(result.services).toStrictEqual(["serviceA", "serviceB"]);
  });
});
