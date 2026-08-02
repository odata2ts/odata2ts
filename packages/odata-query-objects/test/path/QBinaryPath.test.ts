import { describe, expect, test } from "vitest";
import { getIdentityConverter, QBinaryPath } from "../../src";

describe("QBinaryPath test", () => {
  test("smoke test", () => {
    const result = new QBinaryPath("picture");
    expect(result.getPath()).toBe("picture");
  });

  test("carries a converter, defaulting to identity", () => {
    // No filter or order operation applies to binary data, but the generated property service converts
    // values on their way in and out - so a converter has to be there. Without it, generating a client
    // with `enablePrimitivePropertyServices` for a model with an `Edm.Binary` property did not compile.
    expect(new QBinaryPath("picture").converter).toBeDefined();
    expect(new QBinaryPath("picture").converter.convertFrom("AAA")).toBe("AAA");

    const converter = getIdentityConverter<string>();
    expect(new QBinaryPath("picture", converter).converter).toBe(converter);
  });

  test("fails with null, undefined, empty string", () => {
    // @ts-expect-error
    expect(() => new QBinaryPath(null)).toThrow();
    // @ts-expect-error
    expect(() => new QBinaryPath()).toThrow();
    // @ts-expect-error
    expect(() => new QBinaryPath(undefined)).toThrow();
    expect(() => new QBinaryPath("")).toThrow();
    expect(() => new QBinaryPath(" ")).toThrow();
  });
});
