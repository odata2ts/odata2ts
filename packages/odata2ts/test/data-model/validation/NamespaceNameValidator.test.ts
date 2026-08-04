import { beforeEach, describe, expect, test } from "vitest";
import { OperationTypes } from "../../../src/data-model/DataTypeModel.js";
import { NamespaceNameValidator } from "../../../src/data-model/validation/NamespaceNameValidator.js";

describe("NamespaceNameValidator Tests", function () {
  const NS = "my.namespace";
  const OTHER_NS = "other.namespace";

  let validator: NamespaceNameValidator;

  function fq(namespace: string, name: string) {
    return `${namespace}.${name}`;
  }

  beforeEach(() => {
    validator = new NamespaceNameValidator();
  });

  test("smoke test", () => {
    expect(validator.validate()).toStrictEqual(new Map());
  });

  test("passes the name through", () => {
    const name = "Test";

    expect(validator.addEntityType(fq(NS, name), name)).toBe(name);
    expect(validator.addComplexType(fq(NS, "Complex"), "Complex")).toBe("Complex");
    expect(validator.addEnumType(fq(NS, "Enum"), "Enum")).toBe("Enum");
    expect(validator.addEntitySet(fq(NS, "Tests"), "Tests")).toBe("Tests");
    expect(validator.addSingleton(fq(NS, "TheOne"), "TheOne")).toBe("TheOne");
    expect(validator.addOperationImportType(fq(NS, "DoIt"), "DoIt")).toBe("DoIt");
    expect(validator.validate().size).toBe(0);
  });

  test("the same name in another namespace is fine", () => {
    const name = "Branch";

    expect(validator.addEntityType(fq(NS, name), name)).toBe(name);
    // unbundled generation gives each namespace a folder of its own, so this needs no resolution
    expect(validator.addEntityType(fq(OTHER_NS, name), name)).toBe(name);
  });

  test("the same name within one namespace fails the run", () => {
    validator.addEntityType(fq(NS, "item"), "Item");

    expect(() => validator.addEntityType(fq(NS, "Item"), "Item")).toThrow(
      /Name clash in namespace "my.namespace": "my.namespace.item" and "my.namespace.Item" both result in the name "Item"/,
    );
  });

  test("the error points at the configuration which resolves it", () => {
    validator.addComplexType(fq(NS, "address"), "Address");

    expect(() => validator.addComplexType(fq(NS, "Address"), "Address")).toThrow(
      /byTypeAndName: \[\{ name: "my.namespace.Address", type: TypeModel.ComplexType, mappedName: "SomeOtherName" \}\]/,
    );
  });

  test("types and entity container elements are kept apart", () => {
    const name = "Book";

    // an entity set may well carry the name of a type
    expect(validator.addEntityType(fq(NS, name), name)).toBe(name);
    expect(validator.addEntitySet(fq(NS, name), name)).toBe(name);
  });

  test("function overloads are no clash, repeated actions are", () => {
    const fqName = fq(NS, "Search");

    expect(validator.addUnboundOperationType(fqName, "Search", OperationTypes.Function)).toBe("Search");
    // same operation, another overload
    expect(validator.addUnboundOperationType(fqName, "Search", OperationTypes.Function)).toBe("Search");

    const fqAction = fq(NS, "Reset");
    validator.addUnboundOperationType(fqAction, "Reset", OperationTypes.Action);
    expect(() => validator.addUnboundOperationType(fqAction, "Reset", OperationTypes.Action)).toThrow(/Name clash/);
  });

  test("bound operations are scoped by their binding", () => {
    const name = "Reserve";

    expect(validator.addBoundOperationType("Book", fq(NS, name), name, OperationTypes.Action)).toBe(name);
    // the same operation name bound to another entity is a different operation
    expect(validator.addBoundOperationType("Medium", fq(NS, name), name, OperationTypes.Action)).toBe(name);
    expect(() => validator.addBoundOperationType("Book", fq(NS, name), name, OperationTypes.Action)).toThrow(
      /Name clash/,
    );
  });
});
