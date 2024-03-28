import { TypeModel } from "../../../src";
import { NameClashValidator } from "../../../src/data-model/validation/NameClashValidator";

describe("NameValidator Tests", function () {
  let validator: NameClashValidator;

  const NS1 = "Test";
  const NS2 = "Test.2";

  function withNs(ns: string, name: string) {
    return `${ns}.${name}`;
  }

  beforeEach(() => {
    validator = new NameClashValidator();
  });

  test("smoke test", () => {
    expect(validator.validate()).toStrictEqual(new Map());
  });

  test("addEntityType", () => {
    const name = "Test";

    let result = validator.addEntityType(withNs(NS1, name), name);
    let validation = validator.validate();
    expect(result).toBe(name);
    expect(validation.size).toBe(0);

    result = validator.addEntityType(withNs(NS2, name), name);
    validation = validator.validate();
    expect(result).toBe(`${name}2`);
    expect(validation.size).toBe(1);
    expect(validation.get(name)).toStrictEqual([
      { fqName: withNs(NS1, name), type: TypeModel.EntityType },
      { fqName: withNs(NS2, name), type: TypeModel.EntityType, renamedTo: `${name}2` },
    ]);

    result = validator.addEntityType(withNs(NS2, name), name);
    expect(result).toBe(`${name}3`);
  });

  test("without automatic name clash resolution", () => {
    validator = new NameClashValidator({ disableAutomaticNameClashResolution: true });

    const name = "Test";

    let result = validator.addEntityType(withNs(NS1, name), name);
    expect(result).toBe(name);

    result = validator.addEntityType(withNs(NS2, name), name);
    let validation = validator.validate();
    expect(result).toBe(name);
    expect(validation.size).toBe(1);
    expect(validation.get(name)).toStrictEqual([
      { fqName: withNs(NS1, name), type: TypeModel.EntityType },
      { fqName: withNs(NS2, name), type: TypeModel.EntityType },
    ]);

    result = validator.addEntityType(withNs(NS2, name), name);
    expect(result).toBe(name);
  });

  test("addComplexType", () => {
    const name = "cmplx";
    validator.addEntityType(withNs(NS1, name), name);
    validator.addComplexType(withNs(NS2, name), name);

    let validation = validator.validate();
    expect(validation.size).toBe(1);
    expect(validation.get(name)![1]).toStrictEqual({
      fqName: withNs(NS2, name),
      type: TypeModel.ComplexType,
      renamedTo: name + "2",
    });
  });

  test("addEnumType and addOperationType", () => {
    const name = "opEr";
    validator.addEnumType(withNs(NS1, name), name);
    validator.addUnboundOperationType(withNs(NS2, name), name);

    let validation = validator.validate();
    expect(validation.size).toBe(1);
    expect(validation.get(name)).toStrictEqual([
      { fqName: withNs(NS1, name), type: TypeModel.EnumType },
      { fqName: withNs(NS2, name), type: TypeModel.OperationType, renamedTo: name + "2" },
    ]);
  });

  test("use different name", () => {
    const name = "Test";
    const diffName = "TheTest";

    let result = validator.addEntityType(withNs(NS1, name), diffName);
    expect(result).toBe(diffName);

    result = validator.addEntityType(withNs(NS2, name), diffName);
    expect(result).toBe(diffName + "2");
  });
});
