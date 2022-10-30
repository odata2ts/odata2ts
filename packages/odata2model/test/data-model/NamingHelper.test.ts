import { NamingOptions, NamingStrategies, RunOptions, getDefaultConfig } from "../../src";
import { NamingHelper } from "../../src/data-model/NamingHelper";

describe("NamingHelper Tests", function () {
  const SERVICE_NAME = "TRIPPIN";
  const OVERRIDING_SERVICE_NAME = "MyTrip";

  let options: NamingOptions & Pick<RunOptions, "serviceName">;
  let toTest: NamingHelper;

  function createHelper(overrideServiceName: boolean = false) {
    toTest = new NamingHelper(options, SERVICE_NAME, overrideServiceName ? OVERRIDING_SERVICE_NAME : undefined);
  }

  beforeEach(() => {
    options = getDefaultConfig().naming;
  });

  test("with defaultConfig", () => {
    createHelper();

    expect(toTest.getODataServiceName()).toBe(SERVICE_NAME);
    expect(toTest.getServicePrefix()).toBe(SERVICE_NAME + ".");

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
    expect(toTest.getFunctionName("TEST")).toBe("test");
    expect(toTest.getActionName("TEST")).toBe("test");
    expect(toTest.getEntryPointName("TEST")).toBe("test");
    expect(toTest.getRelatedServiceGetter("TEST")).toBe("getTestSrv");
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
    expect(toTest.getFileNameService("test")).toBe("TestService");
  });

  test("fileName settings", () => {
    const newNaming = {
      namingStrategy: NamingStrategies.CONSTANT_CASE,
      prefix: "PREF",
      suffix: "suf",
    };
    options.models!.fileName = newNaming;
    options.queryObjects!.fileName = newNaming;
    options.services!.fileNames = newNaming;
    createHelper();

    expect(toTest.getFileNames()).toStrictEqual({
      model: "PREF_TRIPPIN_SUF",
      qObject: "PREF_TRIPPIN_SUF",
      service: "PREF_TRIPPIN_SUF",
    });
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
    options.disableNamingStrategy = true;
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
    expect(toTest.getEntryPointName("TEST")).toBe("TEST");
  });

  test("ModelName settings", () => {
    options.models!.prefix = "PREF";
    options.models!.suffix = "suf";
    options.models!.namingStrategy = NamingStrategies.CONSTANT_CASE;
    options.models!.propNamingStrategy = NamingStrategies.CONSTANT_CASE;
    createHelper();

    expect(toTest.getModelName("hi")).toBe("PREF_HI_SUF");
    expect(toTest.getModelPropName("TestTest")).toBe("TEST_TEST");
    expect(toTest.getEnumName("myTest")).toBe("PREF_MY_TEST_SUF");
    expect(toTest.getEditableModelName("test")).toBe("PREF_EDITABLE_TEST_SUF");
    expect(toTest.getIdModelName("test")).toBe("PREF_TEST_ID_SUF");
    expect(toTest.getOperationParamsModelName("test")).toBe("PREF_TEST_PARAMS_SUF");
  });

  test("EditableModel settings", () => {
    options.models = {
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
    options.models = {
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
    options.models!.suffix = "MODEL";
    options.models!.namingStrategy = NamingStrategies.CONSTANT_CASE;
    options.models!.operationParamModels = {
      prefix: "PREF",
      applyModelNaming: false,
    };
    createHelper();

    expect(toTest.getOperationParamsModelName("test")).toBe("PREF_TEST");
  });

  test("QueryObject settings", () => {
    options.queryObjects = {
      prefix: "PREF",
      suffix: "suf",
      namingStrategy: NamingStrategies.CONSTANT_CASE,
      propNamingStrategy: NamingStrategies.CONSTANT_CASE,
    };
    createHelper();
    expect(toTest.getQName("test")).toBe("PREF_TEST_SUF");
    expect(toTest.getQPropName("myTEST")).toBe("MY_TEST");
    expect(toTest.getQIdFunctionName("test")).toBe("PREF_TEST_SUF");
    expect(toTest.getQFunctionName("TEST")).toBe("PREF_TEST_SUF");
    expect(toTest.getQActionName("TEST")).toBe("PREF_TEST_SUF");
  });

  test("QIdFunctions settings", () => {
    options.queryObjects!.idFunctions = {
      prefix: "PREF",
      suffix: "suf",
    };
    createHelper();

    // naming strategy is taken over from QueryObjects
    expect(toTest.getQIdFunctionName("TEST")).toBe("QPrefTestSuf");
  });

  test("QOperation base settings", () => {
    options.queryObjects!.operations = {
      prefix: "PREF",
      suffix: "suf",
    };
    createHelper();

    // naming strategy is taken over from QueryObjects
    expect(toTest.getQFunctionName("TEST")).toBe("QPrefTestSuf");
    expect(toTest.getQActionName("TEST")).toBe("QPrefTestSuf");
  });

  test("QFunction & QAction settings", () => {
    options.queryObjects!.operations = {
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
    options.services!.prefix = "PRE";
    options.services!.suffix = "suf";
    options.services!.namingStrategy = NamingStrategies.CONSTANT_CASE;
    createHelper();

    expect(toTest.getServiceName("test")).toBe("PRE_TEST_SUF");
    expect(toTest.getCollectionServiceName("test")).toBe("PRE_TEST_COLLECTION_SUF");
  });

  test("Service: Collection Settings", () => {
    options.services!.prefix = "PRE";
    options.services!.suffix = "suf";
    options.services!.collection = {
      prefix: "Col",
      applyServiceNaming: false,
    };
    createHelper();

    expect(toTest.getServiceName("test")).toBe("PreTestSuf");
    expect(toTest.getCollectionServiceName("test")).toBe("ColTest");
  });

  test("Service: Operation base settings", () => {
    options.services!.operations = {
      prefix: "PREF",
      suffix: "suf",
      namingStrategy: NamingStrategies.CONSTANT_CASE,
    };
    createHelper();

    expect(toTest.getFunctionName("test")).toBe("PREF_TEST_SUF");
    expect(toTest.getActionName("test")).toBe("PREF_TEST_SUF");
  });

  test("Service: Function & Action settings", () => {
    options.services!.operations = {
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
    options.services!.relatedServiceGetter = {
      namingStrategy: NamingStrategies.CONSTANT_CASE,
      prefix: "PREF",
      suffix: "suf",
    };
    createHelper();

    expect(toTest.getRelatedServiceGetter("TEST")).toBe("PREF_TEST_SUF");
  });
});
