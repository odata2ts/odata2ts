import { ConfigFileOptions, NamingStrategies } from "../../src";
import { NamingHelper } from "../../src/data-model/NamingHelper";
import { getTestConfig } from "../test.config";

describe("NamingHelper Tests", function () {
  const SERVICE_NAME = "TRIPPIN";
  const OVERRIDING_SERVICE_NAME = "MyTrip";

  let options: Pick<ConfigFileOptions, "serviceName" | "allowRenaming" | "naming">;
  let toTest: NamingHelper;

  function createHelper(overrideServiceName: boolean = false) {
    toTest = new NamingHelper(options, SERVICE_NAME, overrideServiceName ? OVERRIDING_SERVICE_NAME : undefined);
  }

  beforeEach(() => {
    options = getTestConfig();
  });

  test("with defaultConfig", () => {
    createHelper();

    expect(toTest.getODataServiceName()).toBe(SERVICE_NAME);
    expect(toTest.getServicePrefix()).toBe(SERVICE_NAME + ".");

    expect(toTest.getMainServiceName()).toBe("TrippinService");
    expect(toTest.getFileNames()).toStrictEqual({
      model: "TrippinModel",
      qObject: "QTrippin",
      service: "TrippinService",
    });
    expect(toTest.getFileNameService("test")).toBe("TestService");

    expect(toTest.getModelName("hi")).toBe("Hi");
    expect(toTest.getModelPropName("Test_Test")).toBe("testTest");
    expect(toTest.getEnumName("my_test")).toBe("MyTest");
    expect(toTest.getEditableModelName("test")).toBe("EditableTest");
    expect(toTest.getIdModelName("test")).toBe("TestId");
    expect(toTest.getOperationParamsModelName("TEST")).toBe("TestParams");
    expect(toTest.getQName("test")).toBe("QTest");
    expect(toTest.getQPropName("TEST")).toBe("test");
    expect(toTest.getQFunctionName("TEST")).toBe("QTest");
    expect(toTest.getQActionName("TEST")).toBe("QTest");

    expect(toTest.getServiceName("TEST")).toBe("TestService");
    expect(toTest.getCollectionServiceName("TEST")).toBe("TestCollectionService");
    expect(toTest.getServiceResolverName("TEST")).toBe("createTestServiceResolver");
    expect(toTest.getFunctionName("TEST")).toBe("test");
    expect(toTest.getActionName("TEST")).toBe("test");
    expect(toTest.getRelatedServiceGetter("TEST")).toBe("navToTest");
    expect(toTest.getPrivatePropName("TEST")).toBe("_test");
    expect(toTest.getPublicPropNameForService("TEST")).toBe("Test");
  });

  test("failure cases", () => {
    // @ts-expect-error
    expect(() => new NamingHelper(null, null)).toThrow();
    // @ts-expect-error
    expect(() => new NamingHelper(null, SERVICE_NAME)).toThrow();
    expect(() => new NamingHelper(options, " ")).toThrow();
  });

  test("override service name", () => {
    createHelper(true);

    expect(toTest.getODataServiceName()).toBe(OVERRIDING_SERVICE_NAME);
    expect(toTest.getServicePrefix()).toBe(SERVICE_NAME + ".");

    expect(toTest.getFileNames()).toStrictEqual({
      model: "MyTripModel",
      qObject: "QMyTrip",
      service: "MyTripService",
    });
    expect(toTest.getMainServiceName()).toBe("MyTripService");
    expect(toTest.getFileNameService("test")).toBe("TestService");
  });

  test("fileName settings", () => {
    const newNaming = {
      namingStrategy: NamingStrategies.CONSTANT_CASE,
      prefix: "PREF",
      suffix: "suf",
    };
    options.naming!.models!.fileName = newNaming;
    options.naming!.queryObjects!.fileName = newNaming;
    options.naming!.services!.namingStrategy = newNaming.namingStrategy;
    options.naming!.services!.prefix = newNaming.prefix;
    options.naming!.services!.suffix = newNaming.suffix;
    options.naming!.services!.main = {
      applyServiceNaming: false,
      namingStrategy: NamingStrategies.SNAKE_CASE,
      prefix: "main",
      suffix: "service",
    };
    createHelper();

    expect(toTest.getFileNames()).toStrictEqual({
      model: "PREF_TRIPPIN_SUF",
      qObject: "PREF_TRIPPIN_SUF",
      service: "main_trippin_service",
    });
    expect(toTest.getMainServiceName()).toBe("main_trippin_service");
    expect(toTest.getFileNameService("test")).toBe("PREF_TEST_SUF");
  });

  test("stripServicePrefix", () => {
    createHelper();

    expect(toTest.stripServicePrefix("")).toBe("");
    expect(toTest.stripServicePrefix("test")).toBe("test");
    expect(toTest.stripServicePrefix("B.test")).toBe("B.test");
    expect(toTest.stripServicePrefix("Test_test")).toBe("Test_test");

    expect(toTest.stripServicePrefix(SERVICE_NAME + ".test")).toBe("test");
    expect(toTest.stripServicePrefix(SERVICE_NAME + ".B.test")).toBe("B.test");
  });

  test("disable naming strategy", () => {
    options.allowRenaming = false;
    createHelper();

    expect(toTest.getModelName("hi")).toBe("hi");
    expect(toTest.getModelPropName("Test_Test")).toBe("Test_Test");
    expect(toTest.getEnumName("my_test")).toBe("my_test");
    expect(toTest.getEditableModelName("test")).toBe("Editabletest");
    expect(toTest.getIdModelName("test")).toBe("testId");
    expect(toTest.getQName("test")).toBe("Qtest");
    expect(toTest.getQPropName("TEST")).toBe("TEST");
    expect(toTest.getFunctionName("TEST")).toBe("TEST");
    expect(toTest.getActionName("TEST")).toBe("TEST");
    expect(toTest.getQFunctionName("TEST")).toBe("QTEST");
    expect(toTest.getQActionName("TEST")).toBe("QTEST");
    expect(toTest.getOperationParamsModelName("TEST")).toBe("TESTParams");
  });

  test("ModelName settings", () => {
    options.naming!.models!.prefix = "PREF";
    options.naming!.models!.suffix = "suf";
    options.naming!.models!.namingStrategy = NamingStrategies.CONSTANT_CASE;
    options.naming!.models!.propNamingStrategy = NamingStrategies.SNAKE_CASE;
    createHelper();

    expect(toTest.getModelName("hi")).toBe("PREF_HI_SUF");
    expect(toTest.getModelPropName("TestTest")).toBe("test_test");
    expect(toTest.getEnumName("myTest")).toBe("PREF_MY_TEST_SUF");
    expect(toTest.getEditableModelName("test")).toBe("PREF_EDITABLE_TEST_SUF");
    expect(toTest.getIdModelName("test")).toBe("PREF_TEST_ID_SUF");
    expect(toTest.getOperationParamsModelName("test")).toBe("PREF_TEST_PARAMS_SUF");
  });

  test("EditableModel settings", () => {
    options.naming!.models = {
      prefix: "PREF",
      suffix: "suf",
      namingStrategy: NamingStrategies.CONSTANT_CASE,
      editableModels: {
        suffix: "EditSuffix",
        applyModelNaming: false,
      },
    };
    createHelper();

    expect(toTest.getEditableModelName("test")).toBe("TEST_EDIT_SUFFIX");
  });

  test("IdModel settings", () => {
    options.naming!.models = {
      prefix: "PREF",
      suffix: "suf",
      namingStrategy: NamingStrategies.CONSTANT_CASE,
      idModels: {
        prefix: "id",
        applyModelNaming: false,
      },
    };
    createHelper();

    expect(toTest.getIdModelName("test")).toBe("ID_TEST");
  });

  test("ParamsModel settings", () => {
    options.naming!.models!.suffix = "MODEL";
    options.naming!.models!.namingStrategy = NamingStrategies.CONSTANT_CASE;
    options.naming!.models!.operationParamModels = {
      prefix: "PREF",
      applyModelNaming: false,
    };
    createHelper();

    expect(toTest.getOperationParamsModelName("test")).toBe("PREF_TEST");
  });

  test("QueryObject settings", () => {
    options.naming!.queryObjects = {
      prefix: "PREF",
      suffix: "suf",
      namingStrategy: NamingStrategies.CONSTANT_CASE,
      propNamingStrategy: NamingStrategies.SNAKE_CASE,
    };
    createHelper();
    expect(toTest.getQName("test")).toBe("PREF_TEST_SUF");
    expect(toTest.getQPropName("myTEST")).toBe("my_test");
    expect(toTest.getQIdFunctionName("test")).toBe("PREF_TEST_SUF");
    expect(toTest.getQFunctionName("TEST")).toBe("PREF_TEST_SUF");
    expect(toTest.getQActionName("TEST")).toBe("PREF_TEST_SUF");
  });

  test("QIdFunctions settings", () => {
    options.naming!.queryObjects!.idFunctions = {
      prefix: "PREF",
      suffix: "suf",
    };
    createHelper();

    // naming strategy is taken over from QueryObjects
    expect(toTest.getQIdFunctionName("TEST")).toBe("QPrefTestSuf");
  });

  test("QOperation base settings", () => {
    options.naming!.queryObjects!.operations = {
      prefix: "PREF",
      suffix: "suf",
    };
    createHelper();

    // naming strategy is taken over from QueryObjects
    expect(toTest.getQFunctionName("TEST")).toBe("QPrefTestSuf");
    expect(toTest.getQActionName("TEST")).toBe("QPrefTestSuf");
  });

  test("QFunction & QAction settings", () => {
    options.naming!.queryObjects!.operations = {
      // gets ignored
      prefix: "PREF",
      // ignored
      suffix: "suf",
      action: {
        suffix: "Action",
      },
      function: {
        suffix: "Function",
      },
    };
    createHelper();

    expect(toTest.getQFunctionName("TEST")).toBe("QTestFunction");
    expect(toTest.getQActionName("TEST")).toBe("QTestAction");
  });

  test("Service: Base Settings", () => {
    options.naming!.services!.prefix = "PRE";
    options.naming!.services!.suffix = "suf";
    options.naming!.services!.namingStrategy = NamingStrategies.CONSTANT_CASE;
    createHelper();

    expect(toTest.getServiceName("test")).toBe("PRE_TEST_SUF");
    expect(toTest.getCollectionServiceName("test")).toBe("PRE_TEST_COLLECTION_SUF");
  });

  test("Service: Collection Settings", () => {
    options.naming!.services!.prefix = "PRE";
    options.naming!.services!.suffix = "suf";
    options.naming!.services!.collection = {
      prefix: "Col",
      applyServiceNaming: false,
    };
    createHelper();

    expect(toTest.getServiceName("test")).toBe("PreTestSuf");
    expect(toTest.getCollectionServiceName("test")).toBe("ColTest");
  });

  test("Service: EntityServiceResolver factory function", () => {
    options.naming!.services!.prefix = "PRE";
    options.naming!.services!.suffix = "suf";
    options.naming!.services!.serviceResolverFunction = {
      prefix: "get",
      namingStrategy: NamingStrategies.CONSTANT_CASE,
    };
    createHelper();

    expect(toTest.getServiceResolverName("test")).toBe("GET_TEST");
  });

  test("Service: Operation base settings", () => {
    options.naming!.services!.operations = {
      prefix: "PREF",
      suffix: "suf",
      namingStrategy: NamingStrategies.CONSTANT_CASE,
    };
    createHelper();

    expect(toTest.getFunctionName("test")).toBe("PREF_TEST_SUF");
    expect(toTest.getActionName("test")).toBe("PREF_TEST_SUF");
  });

  test("Service: Function & Action settings", () => {
    options.naming!.services!.operations = {
      namingStrategy: NamingStrategies.PASCAL_CASE,
      // gets ignored
      prefix: "PREF",
      // ignored
      suffix: "suf",
      action: {
        suffix: "Action",
      },
      function: {
        suffix: "Function",
      },
    };
    createHelper();

    expect(toTest.getFunctionName("TEST")).toBe("TestFunction");
    expect(toTest.getActionName("TEST")).toBe("TestAction");
  });

  test("Service: Related service getter settings", () => {
    options.naming!.services!.relatedServiceGetter = {
      namingStrategy: NamingStrategies.CONSTANT_CASE,
      prefix: "PREF",
      suffix: "suf",
    };
    createHelper();

    expect(toTest.getRelatedServiceGetter("TEST")).toBe("PREF_TEST_SUF");
  });

  test("Service: get private prop name for service", () => {
    options.naming!.services!.privateProps = {
      namingStrategy: NamingStrategies.CONSTANT_CASE,
      prefix: "PREF",
      suffix: "suf",
    };
    createHelper();

    expect(toTest.getPrivatePropName("test")).toBe("PREF_TEST_SUF");
  });

  test("Service: get public prop name for service", () => {
    options.naming!.services!.publicProps!.namingStrategy = NamingStrategies.CONSTANT_CASE;
    createHelper();

    expect(toTest.getPublicPropNameForService("test")).toBe("TEST");
  });
});
