import deepmerge from "deepmerge";

import { NamingStrategies } from "../../src";
import { NamespaceWithAlias, withNamespace } from "../../src/data-model/DataModel";
import { ODataVersion } from "../../src/data-model/DataTypeModel";
import { NamingHelper } from "../../src/data-model/NamingHelper";
import { DigesterFunction, DigestionOptions } from "../../src/FactoryFunctionModel";
import { TypeModel } from "../../src/TypeModel";
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
  const DEFAULT_NS: Array<NamespaceWithAlias> = [[SERVICE_NAME], ["x", "y"]];

  let odataBuilder: ODataModelBuilder<any, any, any, any>;
  let digestionOptions: Partial<DigestionOptions> & Pick<TestOptions, "naming" | "allowRenaming">;
  let namespaces: Array<NamespaceWithAlias>;

  function withNs(name: string) {
    return `${SERVICE_NAME}.${name}`;
  }

  async function doDigest() {
    const opts = digestionOptions ? (deepmerge(TEST_CONFIG, digestionOptions) as TestSettings) : TEST_CONFIG;
    return await digest(odataBuilder.getSchemas(), opts, new NamingHelper(opts, SERVICE_NAME, namespaces));
  }

  beforeEach(() => {
    odataBuilder = new ODataBuilderConstructor(SERVICE_NAME);
    digestionOptions = {};
    namespaces = DEFAULT_NS;
  });

  test("Smoke Test", async () => {
    const result = await doDigest();

    expect(result).toBeTruthy();
    expect(result.getODataVersion()).toBe(version);

    expect(result.getEntityTypes()).toEqual([]);
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

    expect(result.getEntityTypes()[0].fqName).toBe(withNs("MY_TYPE"));
    expect(result.getEntityTypes()[0].name).toBe("MyType");
    expect(result.getEntityTypes()[0].props[0].name).toBe("id");
    expect(result.getComplexTypes()[0].fqName).toBe(withNs("HOME_ADDRESS"));
    expect(result.getComplexTypes()[0].name).toBe("HomeAddress");
    expect(result.getComplexTypes()[0].props[0].name).toBe("abcDef");
    expect(result.getEnums()[0].fqName).toBe(withNs("fav_FEAT"));
    expect(result.getEnums()[0].name).toBe("FavFeat");
    expect(result.getEnums()[0].members[0]).toBe("HEY");
  });

  test("using Id of base class", async () => {
    odataBuilder
      .addEntityType("Child", withNs("Parent"), () => {})
      .addEntityType("GrandParent", undefined, (builder) => {
        builder.addKeyProp("ID", "Edm.String");
      })
      .addEntityType("Parent", withNs("GrandParent"), () => {});

    const result = await doDigest();

    expect(result.getEntityTypes().length).toBe(3);
    expect(result.getEntityTypes()[2].name).toBe("Child");
    expect(result.getEntityTypes()[2].idModelName).toBe("GrandParentId");
    expect(result.getEntityTypes()[2].qIdFunctionName).toBe("QGrandParentId");
    expect(result.getEntityTypes()[2].generateId).toBe(false);
  });

  test("complex Id with base class", async () => {
    odataBuilder
      .addEntityType("GrandParent", undefined, (builder) => {
        builder.addKeyProp("ID", "Edm.String");
      })
      .addEntityType("Parent", withNs("GrandParent"), (builder) => {
        builder.addKeyProp("ID2", "Edm.String");
      });

    const result = await doDigest();

    expect(result.getEntityTypes().length).toBe(2);
    expect(result.getEntityTypes()[1].name).toBe("Parent");
    expect(result.getEntityTypes()[1].keys.length).toBe(2);
    expect(result.getEntityTypes()[1].keyNames).toStrictEqual(["ID", "ID2"]);
    expect(result.getEntityTypes()[1].idModelName).toBe("ParentId");
    expect(result.getEntityTypes()[1].qIdFunctionName).toBe("QParentId");
    expect(result.getEntityTypes()[1].generateId).toBe(true);
  });

  test(`base classes with cyclical dependencies`, async () => {
    expect.assertions(1);
    odataBuilder
      .addEntityType("Child", withNs("Parent"), (builder) => builder)
      .addEntityType("Parent", withNs("Child"), (builder) => builder);

    await expect(doDigest()).rejects.toThrowError('Cyclic inheritance detected for model "Tester.Child"!');
  });

  test(`reordering of classes by inheritance`, async () => {
    odataBuilder
      .addEntityType("GrandChild", withNs("Child"), (builder) => builder)
      .addEntityType("Child", withNs("Parent"), (builder) => builder)
      .addEntityType("StandAlone", undefined, (builder) => {
        builder.addKeyProp("ID", "Edm.String");
      })
      .addEntityType("GrandParent", undefined, (builder) => {
        builder.addKeyProp("ID", "Edm.String");
      })
      .addEntityType("Parent", withNs("GrandParent"), (builder) => builder);

    const result = await doDigest();

    expect(result.getEntityTypes().length).toBe(5);
    expect(result.getEntityTypes()[0].name).toBe("GrandParent");
    expect(result.getEntityTypes()[1].name).toBe("Parent");
    expect(result.getEntityTypes()[2].name).toBe("Child");
    expect(result.getEntityTypes()[3].name).toBe("GrandChild");
    expect(result.getEntityTypes()[4].name).toBe("StandAlone");
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

    expect(result.getEntityTypes().length).toBe(2);
    expect(result.getEntityTypes()[1].name).toBe("Parent");
    expect(result.getEntityTypes()[1].keys.length).toBe(2);
    expect(result.getEntityTypes()[1].keyNames).toStrictEqual(["ID", "ID2"]);
    expect(result.getEntityTypes()[1].idModelName).toBe("ParentId");
    expect(result.getEntityTypes()[1].qIdFunctionName).toBe("QParentId");
    expect(result.getEntityTypes()[1].generateId).toBe(true);
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

    expect(result.getEntityTypes().length).toBe(1);

    let toTest = result.getEntityTypes()[0];
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

    let toTest = result.getEntityTypes()[0].props[0];
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
    digestionOptions.byTypeAndName = [
      { type: TypeModel.EntityType, name: "Test", mappedName: "newTest", keys: ["ID", "Version"] },
      { type: TypeModel.ComplexType, name: /Tester\.Complex.*/, mappedName: "cmplx" },
      //  { name: /NS1\.Test/, mappedName: "NS1_Test" },
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

    let toTest = result.getEntityTypes()[0];
    expect(toTest.odataName).toBe("Test");
    expect(toTest.name).toBe("NewTest");
    expect(toTest.idModelName).toBe("NewTestId");
    expect(toTest.qIdFunctionName).toBe("QNewTestId");
    expect(toTest.editableName).toBe("EditableNewTest");
    expect(toTest.keyNames).toStrictEqual(["ID", "Version"]);
    expect(toTest.keys.length).toBe(2);
  });

  test("enum configuration", async () => {
    digestionOptions.byTypeAndName = [{ type: TypeModel.EnumType, name: "Test", mappedName: "newTest" }];

    odataBuilder.addEnumType("Test", [{ name: "one", value: 1 }]);

    const result = await doDigest();

    let toTest = result.getEnums()[0];
    expect(toTest.odataName).toBe("Test");
    expect(toTest.name).toBe("NewTest");
  });

  test("namespace support", async () => {
    const schema2 = "ALT";
    const schema3 = "schema3";

    namespaces.push([schema2], [schema3]);
    odataBuilder
      .addEntityType("Test", undefined, (builder) => {
        builder.addKeyProp("ID", "Edm.String");
        builder.addProp("Version", "Edm.String");
        builder.addProp("Complex", `${schema2}.ComplexTest`);
      })
      .addSchema(schema2)
      .addComplexType("ComplexTest", undefined, (builder) => {
        builder.addProp("Version", "Edm.String");
      })
      .addSchema(schema3)
      .addEntityType("Test", undefined, (builder) => {
        builder.addKeyProp("ID", "Edm.String");
        builder.addProp("Version", "Edm.Boolean");
      });

    const result = await doDigest();
    const ns1Model = withNs("Test");
    const ns3Model = `schema3.Test`;

    let toTest = result.getEntityTypes()[0];
    let toTestAlt = result.getEntityType(ns1Model);
    expect(toTest).toBeDefined();
    expect(toTestAlt).toBeDefined();
    expect(toTest).toStrictEqual(toTestAlt);
    expect(toTest.fqName).toBe(ns1Model);

    toTest = result.getEntityType(ns3Model)!;
    expect(toTest).toBeDefined();
    expect(toTest.fqName).toBe(ns3Model);
  });

  test("namespace alias support", async () => {
    const ns2 = "ALT";
    const alias = "Alias";
    const schema2: NamespaceWithAlias = [ns2, alias];

    namespaces.push(schema2);
    odataBuilder
      .addEntityType("Test", undefined, (builder) => {
        builder.addKeyProp("ID", "Edm.String");
        builder.addProp("Complex", `${alias}.ComplexTest`);
      })
      .addSchema(...schema2)
      .addEntityType("Test", undefined, (builder) => {
        builder.addKeyProp("ID", "Edm.Boolean");
        builder.addProp("Complex", `${alias}.ComplexTest`);
      })
      .addComplexType("ComplexTest", undefined, (builder) => {
        builder.addProp("Version", "Edm.String").addProp("testA", withNs("Test"));
      });

    const result = await doDigest();

    const testFqName = withNs("Test");
    const toTest = result.getEntityTypes()[0];
    const propToTest = toTest.props.find((p) => p.odataName === "Complex");
    expect(toTest).toBeDefined();
    expect(toTest).toStrictEqual(result.getEntityType(testFqName));
    expect(toTest.fqName).toBe(testFqName);
    expect(propToTest).toBeDefined();
    expect(propToTest).toMatchObject({
      type: "ComplexTest",
      fqType: "Alias.ComplexTest",
      odataType: "Alias.ComplexTest",
    });
    expect(result.getComplexType(propToTest!.fqType)).toMatchObject({
      name: "ComplexTest",
      odataName: "ComplexTest",
      fqName: "ALT.ComplexTest",
      props: [
        { odataName: "Version" },
        {
          odataName: "testA",
          type: "Test",
          odataType: "Tester.Test",
          fqType: "Tester.Test",
        },
      ],
    });

    const test2FqName = withNamespace(ns2, "Test");
    const toTest2 = result.getEntityType(withNamespace(ns2, "Test"))!;
    expect(toTest2).toBeDefined();
    expect(toTest2.fqName).toBe(test2FqName);
    expect(result.getEntityType(withNamespace(alias, "Test"))).toStrictEqual(toTest2);
    expect(toTest2.props.find((p) => p.odataName === "Complex")).toMatchObject({
      type: "ComplexTest",
      fqType: "Alias.ComplexTest",
      odataType: "Alias.ComplexTest",
    });
  });
}
