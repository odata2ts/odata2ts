import deepmerge from "deepmerge";

import { NamingStrategies } from "../../src";
import { ODataVersion } from "../../src/data-model/DataTypeModel";
import { NamingHelper } from "../../src/data-model/NamingHelper";
import { DigesterFunction, DigestionOptions } from "../../src/FactoryFunctionModel";
import { TestOptions, TestSettings } from "../generator/TestTypes";
import { getTestConfig } from "../test.config";
import { ODataModelBuilder } from "./builder/ODataModelBuilder";

export type ModelBuilderConstructor<MB extends ODataModelBuilder<any, any, any, any>> = new (serviceName: string) => MB;

export function createDataModelTests(
  version: ODataVersion,
  ODataBuilderConstructor: ModelBuilderConstructor<any>,
  digest: DigesterFunction<any>
) {
  const SERVICE_NAME = "Tester";
  const TEST_CONFIG = getTestConfig();

  let odataBuilder: ODataModelBuilder<any, any, any, any>;
  let digestionOptions: Partial<DigestionOptions> & Pick<TestOptions, "naming" | "allowRenaming">;

  async function doDigest() {
    const opts = digestionOptions ? (deepmerge(TEST_CONFIG, digestionOptions) as TestSettings) : TEST_CONFIG;
    return await digest(odataBuilder.getSchemas(), opts, new NamingHelper(opts, SERVICE_NAME));
  }

  beforeEach(() => {
    odataBuilder = new ODataBuilderConstructor(SERVICE_NAME);
    digestionOptions = {};
  });

  test("Smoke Test", async () => {
    const result = await doDigest();

    expect(result).toBeTruthy();
    expect(result.getODataVersion()).toBe(version);

    expect(result.getModels()).toEqual([]);
    expect(result.getEnums()).toEqual([]);
    expect(result.getEntityContainer()).toEqual({ entitySets: {}, singletons: {}, functions: {}, actions: {} });
  });

  test("consisting casing", async () => {
    odataBuilder
      .addEntityType("MY_TYPE", undefined, (builder) => {
        builder.addKeyProp("ID", "Edm.String");
      })
      .addComplexType("HOME_ADDRESS", undefined, (builder) => {
        builder.addProp("abc_def", "Edm.String");
      })
      .addEnumType("fav_FEAT", [{ name: "HEY", value: 0 }]);

    const result = await doDigest();

    expect(result.getModels()[0].name).toBe("MyType");
    expect(result.getModels()[0].props[0].name).toBe("id");
    expect(result.getComplexTypes()[0].name).toBe("HomeAddress");
    expect(result.getComplexTypes()[0].props[0].name).toBe("abcDef");
    expect(result.getEnums()[0].name).toBe("FavFeat");
    expect(result.getEnums()[0].members[0]).toBe("HEY");
  });

  test("using Id of base class", async () => {
    odataBuilder
      .addEntityType("Child", "Parent", () => {})
      .addEntityType("GrandParent", undefined, (builder) => {
        builder.addKeyProp("ID", "Edm.String");
      })
      .addEntityType("Parent", "GrandParent", () => {});

    const result = await doDigest();

    expect(result.getModels().length).toBe(3);
    expect(result.getModels()[2].name).toBe("Child");
    expect(result.getModels()[2].idModelName).toBe("GrandParentId");
    expect(result.getModels()[2].qIdFunctionName).toBe("QGrandParentId");
    expect(result.getModels()[2].generateId).toBe(false);
  });

  test("complex Id with base class", async () => {
    odataBuilder
      .addEntityType("GrandParent", undefined, (builder) => {
        builder.addKeyProp("ID", "Edm.String");
      })
      .addEntityType("Parent", "GrandParent", (builder) => {
        builder.addKeyProp("ID2", "Edm.String");
      });

    const result = await doDigest();

    expect(result.getModels().length).toBe(2);
    expect(result.getModels()[1].name).toBe("Parent");
    expect(result.getModels()[1].keys.length).toBe(2);
    expect(result.getModels()[1].keyNames).toStrictEqual(["ID", "ID2"]);
    expect(result.getModels()[1].idModelName).toBe("ParentId");
    expect(result.getModels()[1].qIdFunctionName).toBe("QParentId");
    expect(result.getModels()[1].generateId).toBe(true);
  });

  test(`base classes with cyclical dependencies`, async () => {
    expect.assertions(1);
    odataBuilder
      .addEntityType("Child", "Parent", (builder) => builder)
      .addEntityType("Parent", "Child", (builder) => builder);

    await expect(doDigest()).rejects.toThrowError("Cyclic inheritance detected for model Child!");
  });

  test(`reordering of classes by inheritance`, async () => {
    odataBuilder
      .addEntityType("GrandChild", "Child", (builder) => builder)
      .addEntityType("Child", "Parent", (builder) => builder)
      .addEntityType("StandAlone", undefined, (builder) => {
        builder.addKeyProp("ID", "Edm.String");
      })
      .addEntityType("GrandParent", undefined, (builder) => {
        builder.addKeyProp("ID", "Edm.String");
      })
      .addEntityType("Parent", "GrandParent", (builder) => builder);

    const result = await doDigest();

    expect(result.getModels().length).toBe(5);
    expect(result.getModels()[0].name).toBe("GrandParent");
    expect(result.getModels()[1].name).toBe("Parent");
    expect(result.getModels()[2].name).toBe("Child");
    expect(result.getModels()[3].name).toBe("GrandChild");
    expect(result.getModels()[4].name).toBe("StandAlone");
  });

  test.skip("converter test", async () => {
    odataBuilder.addEntityType("Test", undefined, (builder) => {
      builder.addKeyProp("id", "Edm.String");
      builder.addProp("truth", "Edm.Boolean", false);
      builder.addProp("optionalTruth", "Edm.Boolean", true);
    });
    digestionOptions.converters = ["test"];

    // TODO: mock loadConverters method from converter-runtime
    const result = await doDigest();

    expect(result.getModels().length).toBe(2);
    expect(result.getModels()[1].name).toBe("Parent");
    expect(result.getModels()[1].keys.length).toBe(2);
    expect(result.getModels()[1].keyNames).toStrictEqual(["ID", "ID2"]);
    expect(result.getModels()[1].idModelName).toBe("ParentId");
    expect(result.getModels()[1].qIdFunctionName).toBe("QParentId");
    expect(result.getModels()[1].generateId).toBe(true);
  });

  test("naming", async () => {
    digestionOptions.allowRenaming = true;
    digestionOptions.naming = {
      models: {
        namingStrategy: NamingStrategies.CONSTANT_CASE,
        propNamingStrategy: NamingStrategies.CONSTANT_CASE,
        suffix: "Model",
        idModels: {
          prefix: "",
          suffix: "Key",
          applyModelNaming: true,
        },
        editableModels: {
          prefix: "",
          suffix: "EditDummy",
          applyModelNaming: false,
        },
      },
      queryObjects: {
        namingStrategy: NamingStrategies.CONSTANT_CASE,
        propNamingStrategy: NamingStrategies.CONSTANT_CASE,
        prefix: "YYY",
        suffix: "",
        idFunctions: {
          prefix: "",
          suffix: "keyFunc",
        },
      },
      services: {
        namingStrategy: NamingStrategies.CONSTANT_CASE,
        suffix: "srv",
        collection: {
          prefix: "col",
          suffix: "Service",
          applyServiceNaming: false,
        },
        relatedServiceGetter: {
          prefix: "get",
          suffix: "",
        },
      },
    };

    odataBuilder
      .addEntityType("Test", undefined, (builder) => {
        builder.addKeyProp("ID", "Edm.String");
      })
      .addComplexType("ComplexTest", undefined, (builder) => {
        builder.addProp("ageOfEmpire", "Edm.Int32");
      });

    const result = await doDigest();

    expect(result.getModels().length).toBe(1);

    let toTest = result.getModels()[0];
    expect(toTest.name).toBe("TEST_MODEL");
    expect(toTest.keyNames).toStrictEqual(["ID"]);
    expect(toTest.idModelName).toBe("TEST_KEY_MODEL");
    expect(toTest.qIdFunctionName).toBe("YYY_TEST_KEY_FUNC");
    expect(toTest.editableName).toBe("TEST_EDIT_DUMMY");
  });

  test("property configuration", async () => {
    digestionOptions.allowRenaming = true;
    digestionOptions.propertiesByName = [
      { name: "ID", mappedName: "newId", managed: true },
      { name: /ageOfEmpire/, mappedName: "age" },
    ];

    odataBuilder
      .addEntityType("Test", undefined, (builder) => {
        builder.addKeyProp("ID", "Edm.String");
      })
      .addComplexType("ComplexTest", undefined, (builder) => {
        builder.addProp("ageOfEmpire", "Edm.Int32");
      });

    const result = await doDigest();

    let toTest = result.getModels()[0].props[0];
    expect(toTest.odataName).toBe("ID");
    expect(toTest.name).toBe("newId");
    expect(toTest.managed).toBe(true);

    toTest = result.getComplexTypes()[0].props[0];
    expect(toTest.odataName).toBe("ageOfEmpire");
    expect(toTest.name).toBe("age");
    expect(toTest.managed).toBeUndefined();
  });

  test("entity configuration", async () => {
    digestionOptions.allowRenaming = true;
    digestionOptions.entitiesByName = [
      { name: "Test", mappedName: "newTest", keys: ["ID", "Version"] },
      { name: /Complex.*/, mappedName: "cmplx" },
    ];

    odataBuilder
      .addEntityType("Test", undefined, (builder) => {
        builder.addKeyProp("ID", "Edm.String");
        builder.addProp("Version", "Edm.String");
      })
      .addComplexType("ComplexTest", undefined, (builder) => {
        builder.addProp("ageOfEmpire", "Edm.Int32");
      });

    const result = await doDigest();

    let toTestCmplx = result.getComplexTypes()[0];
    expect(toTestCmplx.odataName).toBe("ComplexTest");
    expect(toTestCmplx.name).toBe("Cmplx");
    expect(toTestCmplx.editableName).toBe("EditableCmplx");

    let toTest = result.getModels()[0];
    expect(toTest.odataName).toBe("Test");
    expect(toTest.name).toBe("NewTest");
    expect(toTest.idModelName).toBe("NewTestId");
    expect(toTest.qIdFunctionName).toBe("QNewTestId");
    expect(toTest.editableName).toBe("EditableNewTest");
    expect(toTest.keyNames).toStrictEqual(["ID", "Version"]);
    expect(toTest.keys.length).toBe(2);
  });
}
