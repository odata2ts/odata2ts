import { beforeEach, describe, expect, test } from "vitest";
import { TypeModel } from "../../../src";
import { NameClashValidator } from "../../../src/data-model/validation/NameClashValidator";

describe("NameClashValidator Tests", function () {
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

  test("use different name", () => {
    const name = "Test";
    const diffName = "TheTest";

    let result = validator.addEntityType(withNs(NS1, name), diffName);
    expect(result).toBe(diffName);

    result = validator.addEntityType(withNs(NS2, name), diffName);
    expect(result).toBe(diffName + "2");
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

  test("special logic for addBoundOperationType", () => {
    const entityName = "Test";
    const entity2Name = "Test2";
    const name = "boundOp";

    // when binding operation with same fqName to different entities
    const result1 = validator.addBoundOperationType(withNs(NS1, entityName), withNs(NS1, name), name);
    const result2 = validator.addBoundOperationType(withNs(NS1, entity2Name), withNs(NS1, name), name);

    // then all is fine, no name clash => gets finally prefixed with entity
    expect(result1).toBe(name);
    expect(result2).toBe(name);
    expect(validator.validate().size).toBe(0);

    // when adding bound operation to same entity with same op name (from different namespace)
    const result3 = validator.addBoundOperationType(withNs(NS1, entityName), withNs(NS2, name), name);

    // then we have a name clash
    expect(result3).toBe(name + "2");
    expect(validator.validate().get(name)).toStrictEqual([
      { fqName: withNs(NS1, name), type: TypeModel.OperationType },
      { fqName: withNs(NS2, name), type: TypeModel.OperationType, renamedTo: name + "2" },
    ]);
  });

  test("addEntitySet and addSingleton and addOperationImport", () => {
    const name = "MyService";
    const NS3 = "xyz";

    const entitySetName = validator.addEntitySet(withNs(NS1, name), name);
    const singletonName = validator.addSingleton(withNs(NS2, name), name);
    const opImportName = validator.addOperationImportType(withNs(NS3, name), name);

    expect(entitySetName).toBe(name);
    expect(singletonName).toBe(name + "2");
    expect(opImportName).toBe(name + "3");

    let validation = validator.validate();
    expect(validation.size).toBe(1);
    expect(validation.get(name)).toStrictEqual([
      { fqName: withNs(NS1, name), type: TypeModel.EntitySet },
      { fqName: withNs(NS2, name), type: TypeModel.Singleton, renamedTo: name + "2" },
      { fqName: withNs(NS3, name), type: TypeModel.OperationImportType, renamedTo: name + "3" },
    ]);
  });
});
