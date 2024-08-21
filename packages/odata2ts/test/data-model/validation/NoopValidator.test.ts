import { beforeEach, describe, expect, test } from "vitest";
import { NoopValidator } from "../../../src/data-model/validation/NoopValidator";

describe("NoopValidator Tests", function () {
  let validator: NoopValidator;

  beforeEach(() => {
    validator = new NoopValidator();
  });

  test("smoke test", () => {
    expect(validator.validate()).toStrictEqual(new Map());
  });

  test("addEntityType", () => {
    const name = "Test";

    let result = validator.addEntityType("xy", name);
    expect(result).toBe(name);
    expect(validator.validate().size).toBe(0);

    result = validator.addEntityType("xy", name);
    expect(result).toBe(name);
    expect(validator.validate().size).toBe(0);
  });

  test("use all methods", () => {
    const name = "cmplx";

    expect(validator.addEntityType("xy", name)).toBe(name);
    expect(validator.addEntitySet("xy", name)).toBe(name);
    expect(validator.addComplexType("xy", name)).toBe(name);
    expect(validator.addEnumType("xy", name)).toBe(name);
    expect(validator.addBoundOperationType("test", "xy", name)).toBe(name);
    expect(validator.addUnboundOperationType("xy", name)).toBe(name);
    expect(validator.addOperationImportType("xy", name)).toBe(name);
    expect(validator.addSingleton("xy", name)).toBe(name);
  });
});
