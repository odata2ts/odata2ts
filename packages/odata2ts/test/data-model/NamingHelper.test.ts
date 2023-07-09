import deepmerge from "deepmerge";

import { NamingStrategies, RunOptions, getDefaultConfig } from "../../src";
import { NamingHelper } from "../../src/data-model/NamingHelper";
import { TestOptions } from "../generator/TestTypes";
import { getTestConfigMinimal } from "../test.config";

describe("NamingHelper Tests", function () {
  const SERVICE_NAME = "TRIPPIN";
  const OVERRIDING_SERVICE_NAME = "my_Trip";
  const TEST_CONFIG = getTestConfigMinimal();

  let options: Pick<TestOptions, "serviceName" | "allowRenaming" | "naming">;
  let toTest: NamingHelper;

  function createHelper(overrideServiceName: boolean = false) {
    const config = deepmerge(TEST_CONFIG, options) as Pick<RunOptions, "allowRenaming" | "naming">;
    toTest = new NamingHelper(config, overrideServiceName ? OVERRIDING_SERVICE_NAME : SERVICE_NAME, [SERVICE_NAME]);
  }

  beforeEach(() => {
    options = {};
  });

  test("with defaultConfig", () => {
    options.naming = getDefaultConfig().naming;
    createHelper();

    expect(toTest.getODataServiceName()).toBe(SERVICE_NAME);
    expect(toTest.includesServicePrefix(SERVICE_NAME + ".Test")).toBeTruthy();
    expect(toTest.includesServicePrefix("xxx.Test")).toBeFalsy();

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
    expect(toTest.getFunctionName("TEST")).toBe("test");
    expect(toTest.getActionName("TEST")).toBe("test");
    expect(toTest.getRelatedServiceGetter("TEST")).toBe("test");
    expect(toTest.getPrivatePropName("TEST")).toBe("_test");
  });

  test("failure cases", () => {
    // @ts-expect-error
    expect(() => new NamingHelper(null, null)).toThrow();
    // @ts-expect-error
    expect(() => new NamingHelper(null, SERVICE_NAME)).toThrow();
    expect(() => new NamingHelper(TEST_CONFIG, " ")).toThrow();
  });

  test("override service name", () => {
    createHelper(true);

    expect(toTest.getODataServiceName()).toBe(OVERRIDING_SERVICE_NAME);
    expect(toTest.includesServicePrefix(SERVICE_NAME + ".Test")).toBeTruthy();

    expect(toTest.getFileNames()).toStrictEqual({
      model: `${OVERRIDING_SERVICE_NAME}Model`,
      qObject: `Q${OVERRIDING_SERVICE_NAME}`,
      service: `${OVERRIDING_SERVICE_NAME}Service`,
    });
    expect(toTest.getMainServiceName()).toBe(`${OVERRIDING_SERVICE_NAME}Service`);
    expect(toTest.getFileNameService("test")).toBe("testService");
  });

  test("fileName settings", () => {
    const newNaming = {
      namingStrategy: NamingStrategies.CONSTANT_CASE,
      prefix: "PREF",
      suffix: "suf",
    };

    options.naming = {
      models: {
        fileName: newNaming,
      },
      queryObjects: {
        fileName: newNaming,
      },
      services: {
        prefix: newNaming.prefix,
        suffix: newNaming.suffix,
        namingStrategy: NamingStrategies.CONSTANT_CASE,
        main: {
          applyServiceNaming: false,
          namingStrategy: NamingStrategies.SNAKE_CASE,
          prefix: "main",
          suffix: "service",
        },
      },
    };

    createHelper();

    const fileNames = toTest.getFileNames();
    expect(fileNames).toStrictEqual({
      model: "PREF_TRIPPIN_SUF",
      qObject: "PREF_TRIPPIN_SUF",
      service: "main_trippin_service",
    });
    expect(toTest.getMainServiceName()).toBe(fileNames.service);
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

  test("stripServicePrefix for multiple namespaces", () => {
    const namespace1 = "test";
    const namespace2 = "a*b";
    const namespace3 = "a*b.ddd";
    toTest = new NamingHelper(TEST_CONFIG, namespace1, [namespace1, namespace2, namespace3]);

    expect(toTest.stripServicePrefix("ddd")).toBe("ddd");
    expect(toTest.stripServicePrefix("test")).toBe("test");
    expect(toTest.stripServicePrefix(namespace2 + ".abab")).toBe("abab");
    expect(toTest.stripServicePrefix(namespace3 + ".abab")).toBe("abab");
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
    options.naming = {
      models: {
        prefix: "PREF",
        suffix: "suf",
        namingStrategy: NamingStrategies.CONSTANT_CASE,
        propNamingStrategy: NamingStrategies.SNAKE_CASE,
        editableModels: {
          applyModelNaming: true,
        },
        idModels: {
          applyModelNaming: true,
        },
        operationParamModels: {
          applyModelNaming: true,
        },
      },
    };

    createHelper();

    expect(toTest.getModelName("hi")).toBe("PREF_HI_SUF");
    expect(toTest.getModelPropName("TestTest")).toBe("test_test");
    expect(toTest.getEnumName("myTest")).toBe("PREF_MY_TEST_SUF");
    expect(toTest.getEditableModelName("test")).toBe("PREF_EDITABLE_TEST_SUF");
    expect(toTest.getIdModelName("test")).toBe("PREF_TEST_ID_SUF");
    expect(toTest.getOperationParamsModelName("test")).toBe("PREF_TEST_PARAMS_SUF");
  });

  test("EditableModel settings", () => {
    options.naming = {
      models: {
        prefix: "PREF",
        suffix: "suf",
        namingStrategy: NamingStrategies.CONSTANT_CASE,
        editableModels: {
          prefix: "",
          suffix: "EditSuffix",
          applyModelNaming: false,
        },
      },
    };
    createHelper();

    expect(toTest.getEditableModelName("test")).toBe("TEST_EDIT_SUFFIX");
  });

  test("IdModel settings", () => {
    options.naming = {
      models: {
        prefix: "PREF",
        suffix: "suf",
        namingStrategy: NamingStrategies.CONSTANT_CASE,
        idModels: {
          prefix: "id",
          suffix: "",
          applyModelNaming: false,
        },
      },
    };
    createHelper();

    expect(toTest.getIdModelName("test")).toBe("ID_TEST");
  });

  test("ParamsModel settings", () => {
    options.naming = {
      models: {
        prefix: "",
        suffix: "MODEL",
        namingStrategy: NamingStrategies.CONSTANT_CASE,
        operationParamModels: {
          prefix: "PREF",
          suffix: "",
          applyModelNaming: false,
        },
      },
    };
    createHelper();

    expect(toTest.getOperationParamsModelName("test")).toBe("PREF_TEST");
  });

  test("QueryObject settings", () => {
    options.naming = {
      queryObjects: {
        prefix: "PREF",
        suffix: "suf",
        namingStrategy: NamingStrategies.CONSTANT_CASE,
        propNamingStrategy: NamingStrategies.SNAKE_CASE,
      },
    };
    createHelper();
    expect(toTest.getQName("test")).toBe("PREF_TEST_SUF");
    expect(toTest.getQPropName("myTEST")).toBe("my_test");
    expect(toTest.getQIdFunctionName("test")).toBe("PREF_TEST_ID_SUF");
    expect(toTest.getQFunctionName("TEST")).toBe("PREF_TEST_SUF");
    expect(toTest.getQActionName("TEST")).toBe("PREF_TEST_SUF");
  });

  test("QIdFunctions settings", () => {
    options.naming = {
      queryObjects: {
        idFunctions: {
          prefix: "PREF",
          suffix: "suf",
        },
      },
    };
    createHelper();

    // naming strategy is taken over from QueryObjects
    expect(toTest.getQIdFunctionName("tESt")).toBe("QPREFtEStsuf");

    options.naming!.queryObjects!.namingStrategy = NamingStrategies.SNAKE_CASE;
    createHelper();
    expect(toTest.getQIdFunctionName("test")).toBe("q_pref_test_suf");
  });

  test("QOperation base settings", () => {
    options.naming = {
      queryObjects: {
        operations: {
          prefix: "PREF",
          suffix: "suf",
        },
      },
    };
    createHelper();

    // naming strategy is taken over from QueryObjects
    expect(toTest.getQFunctionName("tESt")).toBe("QPREFtEStsuf");
    expect(toTest.getQActionName("tESt")).toBe("QPREFtEStsuf");

    options.naming!.queryObjects!.namingStrategy = NamingStrategies.SNAKE_CASE;
    createHelper();
    expect(toTest.getQFunctionName("test")).toBe("q_pref_test_suf");
  });

  test("QFunction & QAction settings", () => {
    options.naming = {
      queryObjects: {
        operations: {
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
        },
      },
    };
    createHelper();

    expect(toTest.getQFunctionName("TEST")).toBe("QTESTFunction");
    expect(toTest.getQActionName("TEST")).toBe("QTESTAction");
  });

  test("Service: Base Settings", () => {
    options.naming = {
      services: {
        prefix: "PRE",
        suffix: "suf",
        namingStrategy: NamingStrategies.CONSTANT_CASE,
      },
    };
    createHelper();

    expect(toTest.getServiceName("test")).toBe("PRE_TEST_SUF");
    expect(toTest.getCollectionServiceName("test")).toBe("PRE_TEST_COLLECTION_SUF");
  });

  test("Service: Collection Settings", () => {
    options.naming = {
      services: {
        prefix: "PRE",
        suffix: "suf",
        namingStrategy: NamingStrategies.CONSTANT_CASE,
        collection: {
          prefix: "Col",
          suffix: "",
          applyServiceNaming: false,
        },
      },
    };
    createHelper();

    expect(toTest.getCollectionServiceName("test")).toBe("COL_TEST");
  });

  test("Service: Operation base settings", () => {
    options.naming = {
      services: {
        operations: {
          prefix: "PREF",
          suffix: "suf",
          namingStrategy: NamingStrategies.CONSTANT_CASE,
        },
      },
    };

    createHelper();

    expect(toTest.getFunctionName("test")).toBe("PREF_TEST_SUF");
    expect(toTest.getActionName("test")).toBe("PREF_TEST_SUF");
  });

  test("Service: Function & Action settings", () => {
    options.naming = {
      services: {
        operations: {
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
        },
      },
    };
    createHelper();

    expect(toTest.getFunctionName("TEST")).toBe("TestFunction");
    expect(toTest.getActionName("TEST")).toBe("TestAction");
  });

  test("Service: Related service getter settings", () => {
    options.naming = {
      services: {
        relatedServiceGetter: {
          namingStrategy: NamingStrategies.CONSTANT_CASE,
          prefix: "PREF",
          suffix: "suf",
        },
      },
    };
    createHelper();

    expect(toTest.getRelatedServiceGetter("TEST")).toBe("PREF_TEST_SUF");
  });

  test("Service: get private prop name for service", () => {
    options.naming = {
      services: {
        privateProps: {
          prefix: "PRE",
          suffix: "suf",
          namingStrategy: NamingStrategies.CONSTANT_CASE,
        },
      },
    };
    createHelper();

    expect(toTest.getPrivatePropName("test")).toBe("PRE_TEST_SUF");
  });
});
