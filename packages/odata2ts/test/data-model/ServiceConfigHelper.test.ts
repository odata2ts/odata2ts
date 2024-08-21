import { describe, expect, test } from "vitest";
import { PropertyGenerationOptions, TypeBasedGenerationOptions, TypeModel } from "../../src";
import { NamespaceWithAlias } from "../../src/data-model/DataModel";
import { ServiceConfigHelper } from "../../src/data-model/ServiceConfigHelper";

describe("ServiceConfigHelper Tests", function () {
  const DEFAULT_NAMESPACES: NamespaceWithAlias = ["NS1", "self"];

  let toTest: ServiceConfigHelper;

  function createHelperWithProps(...propsSetting: Array<PropertyGenerationOptions>) {
    toTest = new ServiceConfigHelper({
      converters: [],
      disableAutoManagedKey: false,
      byTypeAndName: [],
      propertiesByName: propsSetting || [],
      skipEditableModels: false,
      v2ModelsWithExtraResultsWrapping: false,
      v4BigNumberAsString: false,
      skipComments: true,
      disableAutomaticNameClashResolution: false,
      bundledFileGeneration: false,
    });
  }

  function createHelperWithEntities(...entsSetting: Array<TypeBasedGenerationOptions>) {
    toTest = new ServiceConfigHelper({
      converters: [],
      disableAutoManagedKey: false,
      byTypeAndName: entsSetting || [],
      propertiesByName: [],
      skipEditableModels: false,
      v2ModelsWithExtraResultsWrapping: false,
      v4BigNumberAsString: false,
      skipComments: true,
      disableAutomaticNameClashResolution: false,
      bundledFileGeneration: false,
    });
  }

  test("propByName: empty options", () => {
    createHelperWithProps();

    expect(toTest.findPropConfigByName("test")).toBeUndefined();
  });

  test("propByName: matching, but empty config", () => {
    const name = "test";
    createHelperWithProps({ name });

    expect(toTest.findPropConfigByName(name)).toStrictEqual({});
    expect(toTest.findPropConfigByName("xxx")).toBeUndefined();
  });

  test("propByName: simple name mapping", () => {
    const name = "test";
    const mappedName = "xyz";

    // by string
    createHelperWithProps({ name, mappedName });
    let result = toTest.findPropConfigByName(name);

    expect(result).toStrictEqual({ mappedName });

    // by RegExp
    const nameRegExp = /test/;
    createHelperWithProps({ name: nameRegExp, mappedName });
    result = toTest.findPropConfigByName(name);

    expect(result).toStrictEqual({ mappedName });
  });

  test("propByName: wrong name option", () => {
    const exceptionNoName = "No value for required attribute [name] specified!";
    const exceptionWrongType = "Wrong type for attribute [name]!";

    // @ts-ignore
    expect(() => createHelperWithProps({ name: undefined })).toThrow(exceptionNoName);
    // @ts-ignore
    expect(() => createHelperWithProps({ name: null })).toThrow(exceptionNoName);
    expect(() => createHelperWithProps({ name: "" })).toThrow(exceptionNoName);
    // @ts-ignore
    expect(() => createHelperWithProps({ name: {} })).toThrow(exceptionWrongType);
  });

  test("propByName: case insensitive regexp", () => {
    const name = /test/i;
    const mappedName = "xyz";
    const expectedResult = { mappedName };

    createHelperWithProps({ name, mappedName });

    expect(toTest.findPropConfigByName("test")).toStrictEqual(expectedResult);
    expect(toTest.findPropConfigByName("Test")).toStrictEqual(expectedResult);
    expect(toTest.findPropConfigByName("TeST")).toStrictEqual(expectedResult);
    expect(toTest.findPropConfigByName("xxx")).toBeUndefined();
  });

  test("propByName: regexp replacing", () => {
    const name = /(\d+)test(\d+)/;
    const mappedName = "xyz$1_$2";

    createHelperWithProps({ name, mappedName });

    expect(toTest.findPropConfigByName("test")).toBeUndefined();
    expect(toTest.findPropConfigByName("123test456")).toStrictEqual({ mappedName: "xyz123_456" });
  });

  test("propByName: managed", () => {
    const name = "test";

    let managed = true;
    createHelperWithProps({ name, managed });
    expect(toTest.findPropConfigByName(name)).toStrictEqual({ managed });

    managed = false;
    createHelperWithProps({ name, managed });
    expect(toTest.findPropConfigByName(name)).toStrictEqual({ managed });
  });

  test("propByName: multiple matching regexps", () => {
    const name = /(\d+)test(\d+)/;
    const mappedName = "xyz$1_$2";

    const name2 = /(\d+)test.*/i;
    const mappedName2 = "xyz$1";
    const result2 = "xyz123";

    createHelperWithProps({ name, mappedName, managed: true }, { name: name2, mappedName: mappedName2 });

    // only mapping2 applies
    expect(toTest.findPropConfigByName("123test")).toStrictEqual({ mappedName: result2 });
    expect(toTest.findPropConfigByName("123Test456")).toStrictEqual({ mappedName: result2 });
    // combined mappings apply => merged, but last one wins the name mapping
    expect(toTest.findPropConfigByName("123test456")).toStrictEqual({ mappedName: result2, managed: true });
  });

  test("find config: empty options", () => {
    createHelperWithEntities();

    expect(toTest.findEntityTypeConfig(DEFAULT_NAMESPACES, "test")).toBeUndefined();
    expect(toTest.findComplexTypeConfig(DEFAULT_NAMESPACES, "test")).toBeUndefined();
    expect(toTest.findEnumTypeConfig(DEFAULT_NAMESPACES, "test")).toBeUndefined();
    expect(toTest.findOperationTypeConfig(DEFAULT_NAMESPACES, "test")).toBeUndefined();
  });

  test("find config: matching any type", () => {
    const name = "test";
    createHelperWithEntities({ type: TypeModel.Any, name });

    expect(toTest.findEntityTypeConfig(DEFAULT_NAMESPACES, name)).toStrictEqual({});
    expect(toTest.findComplexTypeConfig(DEFAULT_NAMESPACES, name)).toStrictEqual({});
    expect(toTest.findEnumTypeConfig(DEFAULT_NAMESPACES, name)).toStrictEqual({});
    expect(toTest.findOperationTypeConfig(DEFAULT_NAMESPACES, name)).toStrictEqual({});
  });

  test("find config: matching entity type", () => {
    const name = "test";
    createHelperWithEntities({ type: TypeModel.EntityType, name });

    expect(toTest.findEntityTypeConfig(DEFAULT_NAMESPACES, name)).toStrictEqual({});
    expect(toTest.findComplexTypeConfig(DEFAULT_NAMESPACES, name)).toBeUndefined();
    expect(toTest.findEnumTypeConfig(DEFAULT_NAMESPACES, name)).toBeUndefined();
    expect(toTest.findOperationTypeConfig(DEFAULT_NAMESPACES, name)).toBeUndefined();
  });

  test("find config: matching complex type", () => {
    const name = "test";
    createHelperWithEntities({ type: TypeModel.ComplexType, name });

    expect(toTest.findEntityTypeConfig(DEFAULT_NAMESPACES, name)).toBeUndefined();
    expect(toTest.findComplexTypeConfig(DEFAULT_NAMESPACES, name)).toStrictEqual({});
    expect(toTest.findEnumTypeConfig(DEFAULT_NAMESPACES, name)).toBeUndefined();
    expect(toTest.findOperationTypeConfig(DEFAULT_NAMESPACES, name)).toBeUndefined();
  });

  test("find config: matching enum type", () => {
    const name = "test";
    createHelperWithEntities({ type: TypeModel.EnumType, name });

    expect(toTest.findEntityTypeConfig(DEFAULT_NAMESPACES, name)).toBeUndefined();
    expect(toTest.findComplexTypeConfig(DEFAULT_NAMESPACES, name)).toBeUndefined();
    expect(toTest.findEnumTypeConfig(DEFAULT_NAMESPACES, name)).toStrictEqual({});
    expect(toTest.findOperationTypeConfig(DEFAULT_NAMESPACES, name)).toBeUndefined();
  });

  test("find config: matching operation type", () => {
    const name = "test";
    createHelperWithEntities({ type: TypeModel.OperationType, name });

    expect(toTest.findEntityTypeConfig(DEFAULT_NAMESPACES, name)).toBeUndefined();
    expect(toTest.findComplexTypeConfig(DEFAULT_NAMESPACES, name)).toBeUndefined();
    expect(toTest.findEnumTypeConfig(DEFAULT_NAMESPACES, name)).toBeUndefined();
    expect(toTest.findOperationTypeConfig(DEFAULT_NAMESPACES, name)).toStrictEqual({});
  });

  test("find config: matching with namespace", () => {
    const [ns] = DEFAULT_NAMESPACES;
    const name = "test";

    // when using a namespace
    createHelperWithEntities({ type: TypeModel.Any, name: `${ns}.${name}` });

    // then we find the config
    expect(toTest.findEntityTypeConfig(DEFAULT_NAMESPACES, name)).toStrictEqual({});
  });

  test("find config: matching with namespace alias", () => {
    const [_, alias] = DEFAULT_NAMESPACES;
    const name = "test";
    createHelperWithEntities({ type: TypeModel.EntityType, name: `${alias}.${name}` });

    expect(toTest.findEntityTypeConfig(DEFAULT_NAMESPACES, name)).toStrictEqual({});
  });

  test("find config: simple name mapping", () => {
    const name = "test";
    const mappedName = "xyz";

    // by string
    createHelperWithEntities({ type: TypeModel.Any, name, mappedName });
    let result = toTest.findEntityTypeConfig(DEFAULT_NAMESPACES, name);

    expect(result).toStrictEqual({ mappedName });

    // by RegExp
    const nameRegExp = /NS1.test/;
    createHelperWithEntities({ type: TypeModel.Any, name: nameRegExp, mappedName });
    result = toTest.findEntityTypeConfig(DEFAULT_NAMESPACES, name);

    expect(result).toStrictEqual({ mappedName });
  });

  test("find config: wrong name option", () => {
    const exceptionNoName = "No value for required attribute [name] specified!";
    const exceptionWrongType = "Wrong type for attribute [name]!";

    // @ts-ignore
    expect(() => createHelperWithEntities({ type: TypeModel.Any, name: undefined })).toThrow(exceptionNoName);
    // @ts-ignore
    expect(() => createHelperWithEntities({ type: TypeModel.Any, name: null })).toThrow(exceptionNoName);
    expect(() => createHelperWithEntities({ type: TypeModel.Any, name: "" })).toThrow(exceptionNoName);
    // @ts-ignore
    expect(() => createHelperWithEntities({ name: {} })).toThrow(exceptionWrongType);
  });

  test("find config: case insensitive regexp", () => {
    const [ns, alias] = DEFAULT_NAMESPACES;
    const name = /NS1\.test/i;
    const mappedName = "xyz";
    const expectedResult = { mappedName };

    createHelperWithEntities({ type: TypeModel.Any, name, mappedName });

    expect(toTest.findEntityTypeConfig(DEFAULT_NAMESPACES, "test")).toStrictEqual(expectedResult);
    expect(toTest.findEntityTypeConfig(DEFAULT_NAMESPACES, "Test")).toStrictEqual(expectedResult);
    expect(toTest.findEntityTypeConfig(DEFAULT_NAMESPACES, "TeST")).toStrictEqual(expectedResult);
    expect(toTest.findEntityTypeConfig(DEFAULT_NAMESPACES, "xxx")).toBeUndefined();
    expect(toTest.findEntityTypeConfig(["xyz"], "test")).toBeUndefined();
  });

  test("find config: regexp replacing", () => {
    const name = /NS1\.(\d+)test(\d+)/;
    const mappedName = "xyz$1$2";

    createHelperWithEntities({ type: TypeModel.Any, name, mappedName });

    expect(toTest.findEntityTypeConfig(DEFAULT_NAMESPACES, "test")).toBeUndefined();
    expect(toTest.findEntityTypeConfig(DEFAULT_NAMESPACES, "123test456")).toStrictEqual({ mappedName: "xyz123456" });
  });

  test("find config: multiple matching regexps = last one wins", () => {
    const name = /NS1.(\d+)test(\d+)/;
    const mappedName = "xyz$1_$2";

    const name2 = /NS1.(\d+)test.*/i;
    const mappedName2 = "xyz$1";
    const result2 = "xyz123";

    createHelperWithEntities(
      { type: TypeModel.Any, name, mappedName },
      { type: TypeModel.Any, name: name2, mappedName: mappedName2 },
    );

    // only mapping2 applies
    expect(toTest.findEntityTypeConfig(DEFAULT_NAMESPACES, "123test")).toStrictEqual({ mappedName: result2 });
    expect(toTest.findEntityTypeConfig(DEFAULT_NAMESPACES, "123Test456")).toStrictEqual({ mappedName: result2 });
  });
});
