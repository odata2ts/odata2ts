import { EntityGenerationOptions, PropertyGenerationOptions } from "../../src";
import { NamespaceWithAlias } from "../../src/data-model/DataModel";
import { ServiceConfigHelper } from "../../src/data-model/ServiceConfigHelper";

describe("ServiceConfigHelper Tests", function () {
  const DEFAULT_NAMESPACES: NamespaceWithAlias = ["NS1", "self"];

  let toTest: ServiceConfigHelper;

  function createHelperWithProps(...propsSetting: Array<PropertyGenerationOptions>) {
    toTest = new ServiceConfigHelper({
      converters: [],
      disableAutoManagedKey: false,
      entitiesByName: [],
      propertiesByName: propsSetting || [],
      skipEditableModels: false,
      v2ModelsWithExtraResultsWrapping: false,
      v4BigNumberAsString: false,
      skipComments: true,
    });
  }

  function createHelperWithEntities(...entsSetting: Array<EntityGenerationOptions>) {
    toTest = new ServiceConfigHelper({
      converters: [],
      disableAutoManagedKey: false,
      entitiesByName: entsSetting || [],
      propertiesByName: [],
      skipEditableModels: false,
      v2ModelsWithExtraResultsWrapping: false,
      v4BigNumberAsString: false,
      skipComments: true,
    });
  }

  test("propByName: empty options", () => {
    createHelperWithProps();

    expect(toTest.findConfigPropByName("test")).toBeUndefined();
  });

  test("propByName: matching, but empty config", () => {
    const name = "test";
    createHelperWithProps({ name });

    expect(toTest.findConfigPropByName(name)).toStrictEqual({});
    expect(toTest.findConfigPropByName("xxx")).toBeUndefined();
  });

  test("propByName: simple name mapping", () => {
    const name = "test";
    const mappedName = "xyz";

    // by string
    createHelperWithProps({ name, mappedName });
    let result = toTest.findConfigPropByName(name);

    expect(result).toStrictEqual({ mappedName });

    // by RegExp
    const nameRegExp = /test/;
    createHelperWithProps({ name: nameRegExp, mappedName });
    result = toTest.findConfigPropByName(name);

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

    expect(toTest.findConfigPropByName("test")).toStrictEqual(expectedResult);
    expect(toTest.findConfigPropByName("Test")).toStrictEqual(expectedResult);
    expect(toTest.findConfigPropByName("TeST")).toStrictEqual(expectedResult);
    expect(toTest.findConfigPropByName("xxx")).toBeUndefined();
  });

  test("propByName: regexp replacing", () => {
    const name = /(\d+)test(\d+)/;
    const mappedName = "xyz$1_$2";

    createHelperWithProps({ name, mappedName });

    expect(toTest.findConfigPropByName("test")).toBeUndefined();
    expect(toTest.findConfigPropByName("123test456")).toStrictEqual({ mappedName: "xyz123_456" });
  });

  test("propByName: managed", () => {
    const name = "test";

    let managed = true;
    createHelperWithProps({ name, managed });
    expect(toTest.findConfigPropByName(name)).toStrictEqual({ managed });

    managed = false;
    createHelperWithProps({ name, managed });
    expect(toTest.findConfigPropByName(name)).toStrictEqual({ managed });
  });

  test("propByName: multiple matching regexps", () => {
    const name = /(\d+)test(\d+)/;
    const mappedName = "xyz$1_$2";

    const name2 = /(\d+)test.*/i;
    const mappedName2 = "xyz$1";
    const result2 = "xyz123";

    createHelperWithProps({ name, mappedName, managed: true }, { name: name2, mappedName: mappedName2 });

    // only mapping2 applies
    expect(toTest.findConfigPropByName("123test")).toStrictEqual({ mappedName: result2 });
    expect(toTest.findConfigPropByName("123Test456")).toStrictEqual({ mappedName: result2 });
    // combined mappings apply => merged, but last one wins the name mapping
    expect(toTest.findConfigPropByName("123test456")).toStrictEqual({ mappedName: result2, managed: true });
  });

  test("entitiesByName: empty options", () => {
    createHelperWithEntities();

    expect(toTest.findConfigEntityByName(DEFAULT_NAMESPACES, "test")).toBeUndefined();
  });

  test("entitiesByName: matching with empty config", () => {
    const name = "test";
    createHelperWithEntities({ name });

    expect(toTest.findConfigEntityByName(DEFAULT_NAMESPACES, name)).toStrictEqual({});
    expect(toTest.findConfigEntityByName(DEFAULT_NAMESPACES, "xxx")).toBeUndefined();
  });

  test("entitiesByName: matching with namespace", () => {
    const [ns] = DEFAULT_NAMESPACES;
    const name = "test";

    // when using a namespace
    createHelperWithEntities({ name: `${ns}.${name}` });

    // then we find the config
    expect(toTest.findConfigEntityByName(DEFAULT_NAMESPACES, name)).toStrictEqual({});
  });

  test("entitiesByName: matching with namespace alias", () => {
    const [_, alias] = DEFAULT_NAMESPACES;
    const name = "test";
    createHelperWithEntities({ name: `${alias}.${name}` });

    expect(toTest.findConfigEntityByName(DEFAULT_NAMESPACES, name)).toStrictEqual({});
  });

  test("entitiesByName: simple name mapping", () => {
    const name = "test";
    const mappedName = "xyz";

    // by string
    createHelperWithEntities({ name, mappedName });
    let result = toTest.findConfigEntityByName(DEFAULT_NAMESPACES, name);

    expect(result).toStrictEqual({ mappedName });

    // by RegExp
    const nameRegExp = /NS1.test/;
    createHelperWithEntities({ name: nameRegExp, mappedName });
    result = toTest.findConfigEntityByName(DEFAULT_NAMESPACES, name);

    expect(result).toStrictEqual({ mappedName });
  });

  test("entitiesByName: wrong name option", () => {
    const exceptionNoName = "No value for required attribute [name] specified!";
    const exceptionWrongType = "Wrong type for attribute [name]!";

    // @ts-ignore
    expect(() => createHelperWithEntities({ name: undefined })).toThrow(exceptionNoName);
    // @ts-ignore
    expect(() => createHelperWithEntities({ name: null })).toThrow(exceptionNoName);
    expect(() => createHelperWithEntities({ name: "" })).toThrow(exceptionNoName);
    // @ts-ignore
    expect(() => createHelperWithEntities({ name: {} })).toThrow(exceptionWrongType);
  });

  test("entitiesByName: case insensitive regexp", () => {
    const [ns, alias] = DEFAULT_NAMESPACES;
    const name = /NS1\.test/i;
    const mappedName = "xyz";
    const expectedResult = { mappedName };

    createHelperWithEntities({ name, mappedName });

    expect(toTest.findConfigEntityByName(DEFAULT_NAMESPACES, "test")).toStrictEqual(expectedResult);
    expect(toTest.findConfigEntityByName(DEFAULT_NAMESPACES, "Test")).toStrictEqual(expectedResult);
    expect(toTest.findConfigEntityByName(DEFAULT_NAMESPACES, "TeST")).toStrictEqual(expectedResult);
    expect(toTest.findConfigEntityByName(DEFAULT_NAMESPACES, "xxx")).toBeUndefined();
    expect(toTest.findConfigEntityByName(["xyz"], "test")).toBeUndefined();
  });

  test("entitiesByName: regexp replacing", () => {
    const name = /NS1\.(\d+)test(\d+)/;
    const mappedName = "xyz$1$2";

    createHelperWithEntities({ name, mappedName });

    expect(toTest.findConfigEntityByName(DEFAULT_NAMESPACES, "test")).toBeUndefined();
    expect(toTest.findConfigEntityByName(DEFAULT_NAMESPACES, "123test456")).toStrictEqual({ mappedName: "xyz123456" });
  });

  test("entitiesByName: multiple matching regexps = last one wins", () => {
    const name = /NS1.(\d+)test(\d+)/;
    const mappedName = "xyz$1_$2";

    const name2 = /NS1.(\d+)test.*/i;
    const mappedName2 = "xyz$1";
    const result2 = "xyz123";

    createHelperWithEntities({ name, mappedName }, { name: name2, mappedName: mappedName2 });

    // only mapping2 applies
    expect(toTest.findConfigEntityByName(DEFAULT_NAMESPACES, "123test")).toStrictEqual({ mappedName: result2 });
    expect(toTest.findConfigEntityByName(DEFAULT_NAMESPACES, "123Test456")).toStrictEqual({ mappedName: result2 });
  });
});
