import { describe, expect, test } from "vitest";
import { createFormatter } from "../../../src/project/formatter/index.js";
import { NoopFormatter } from "../../../src/project/formatter/NoopFormatter.js";
import { PrettierFormatter } from "../../../src/project/formatter/PrettierFormatter.js";

describe("formatter factory tests", () => {
  test("usePrettier=false creates an initialized NoopFormatter", async () => {
    const formatter = await createFormatter("./out", false);

    expect(formatter).toBeInstanceOf(NoopFormatter);
  });

  test("usePrettier=true creates an initialized PrettierFormatter", async () => {
    const formatter = await createFormatter("./out", true);

    expect(formatter).toBeInstanceOf(PrettierFormatter);
  });
});
