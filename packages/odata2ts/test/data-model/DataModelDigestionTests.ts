import { ODataTypesV4 } from "@odata2ts/odata-core";
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
    expect(result.getEntityTypes()[0].modelName).toBe("MyType");
    expect(result.getEntityTypes()[0].props[0].name).toBe("id");
    expect(result.getComplexTypes()[0].fqName).toBe(withNs("HOME_ADDRESS"));
    expect(result.getComplexTypes()[0].modelName).toBe("HomeAddress");
    expect(result.getComplexTypes()[0].props[0].name).toBe("abcDef");
    expect(result.getEnums()[0].fqName).toBe(withNs("fav_FEAT"));
    expect(result.getEnums()[0].modelName).toBe("FavFeat");
    expect(result.getEnums()[0].members[0]).toBe("HEY");
  });

  test("Type Definition", async () => {
    odataBuilder.addTypeDefinition("MY_TYPE", ODataTypesV4.String);

    const result = await doDigest();
    expect(result).toBeDefined();
    expect(result.getPrimitiveType(withNs("MY_TYPE"))).toBe(ODataTypesV4.String);
  });

  test("Entity Type", async () => {
    odataBuilder.addEntityType("MY_TYPE", undefined, (builder) => {
      builder.addKeyProp("ID", "Edm.String");
    });

    const result = await doDigest();

    expect(result).toBeDefined();
    expect(result.getEntityTypes().length).toBe(1);

    const toTest = result.getEntityTypes()[0];
    expect(toTest).toBeDefined();
    expect(toTest.keys.length).toBe(1);
    expect(toTest.props.length).toBe(1);
  });

  test("using Id of base class", async () => {
    odataBuilder
      .addEntityType("Child", { baseType: withNs("Parent") }, () => {})
      .addEntityType("GrandParent", undefined, (builder) => {
        builder.addKeyProp("ID", "Edm.String");
      })
      .addEntityType("Parent", { baseType: withNs("GrandParent") }, () => {});

    const result = await doDigest();

    expect(result.getEntityTypes().length).toBe(3);

    const toTest = result.getEntityTypes()[2];
    expect(toTest.name).toBe("Child");
    expect(toTest.id.modelName).toBe("GrandParentId");
    expect(toTest.id.qName).toBe("QGrandParentId");
    expect(toTest.generateId).toBe(false);
    expect(toTest.props.length).toBe(0);
    expect(toTest.baseProps.length).toBe(1);
  });

  test("complex Id with base class", async () => {
    odataBuilder
      .addEntityType("GrandParent", undefined, (builder) => {
        builder.addKeyProp("ID", "Edm.String");
      })
      .addEntityType("Parent", { baseType: withNs("GrandParent") }, (builder) => {
        builder.addKeyProp("ID2", "Edm.String");
      });

    const result = await doDigest();

    expect(result.getEntityTypes().length).toBe(2);
    expect(result.getEntityTypes()[1].name).toBe("Parent");
    expect(result.getEntityTypes()[1].props.length).toBe(1);
    expect(result.getEntityTypes()[1].baseProps.length).toBe(1);
    expect(result.getEntityTypes()[1].keys.length).toBe(2);
    expect(result.getEntityTypes()[1].keyNames).toStrictEqual(["ID", "ID2"]);
    expect(result.getEntityTypes()[1].id.modelName).toBe("ParentId");
    expect(result.getEntityTypes()[1].id.qName).toBe("QParentId");
    expect(result.getEntityTypes()[1].generateId).toBe(true);
  });

  test(`base classes with cyclical dependencies`, async () => {
    expect.assertions(1);
    odataBuilder
      .addEntityType("Child", { baseType: withNs("Parent") }, (builder) => builder)
      .addEntityType("Parent", { baseType: withNs("Child") }, (builder) => builder);

    await expect(doDigest()).rejects.toThrowError('Cyclic inheritance detected for model "Tester.Child"!');
  });

  test(`reordering of classes by inheritance`, async () => {
    odataBuilder
      .addEntityType("GrandChild", { baseType: withNs("Child") }, (builder) => builder)
      .addEntityType("Child", { baseType: withNs("Parent") }, (builder) => builder)
      .addEntityType("StandAlone", undefined, (builder) => {
        builder.addKeyProp("ID", "Edm.String");
      })
      .addEntityType("GrandParent", undefined, (builder) => {
        builder.addKeyProp("ID", "Edm.String");
      })
      .addEntityType("Parent", { baseType: withNs("GrandParent") }, (builder) => builder);

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
    expect(result.getEntityTypes()[1].id.modelName).toBe("ParentId");
    expect(result.getEntityTypes()[1].id.qName).toBe("QParentId");
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
    expect(toTest.modelName).toBe("TEST_MODEL");
    expect(toTest.keyNames).toStrictEqual(["ID"]);
    expect(toTest.id.modelName).toBe("TEST_KEY_MODEL");
    expect(toTest.id.qName).toBe("YYY_TEST_KEY_FUNC");
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
    expect(toTestCmplx.modelName).toBe("Cmplx");
    expect(toTestCmplx.editableName).toBe("EditableCmplx");

    let toTest = result.getEntityTypes()[0];
    expect(toTest.odataName).toBe("Test");
    expect(toTest.modelName).toBe("NewTest");
    expect(toTest.id.modelName).toBe("NewTestId");
    expect(toTest.id.qName).toBe("QNewTestId");
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
    expect(toTest.modelName).toBe("NewTest");
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
    expect(toTest.name).toBe("Test");

    toTest = result.getEntityType(ns3Model)!;
    expect(toTest).toBeDefined();
    expect(toTest.fqName).toBe(ns3Model);
    // auto name clash resolution
    expect(toTest.name).toBe("Test2");
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

  test("support abstract models", async () => {
    odataBuilder
      .addEntityType("Abstract", { abstract: true }, () => {})
      .addEntityType("ExtendsAbstract", { baseType: withNs("Abstract") }, (builder) => {
        return builder.addKeyProp("ID", ODataTypesV4.String);
      });

    const result = await doDigest();

    let toTest = result.getEntityTypes()[0];
    expect(toTest).toBeDefined();
    expect(toTest.fqName).toStrictEqual(withNs("Abstract"));
    expect(toTest.abstract).toBe(true);
    expect(toTest.keys).toStrictEqual([]);
    expect(toTest.props).toStrictEqual([]);

    toTest = result.getEntityTypes()[1];
    expect(toTest).toBeDefined();
    expect(toTest.fqName).toBe(withNs("ExtendsAbstract"));
    expect(toTest.abstract).toBe(false);
    expect(toTest.keys.length).toBe(1);
    expect(toTest.props.length).toBe(1);
  });

  test("support open models", async () => {
    odataBuilder
      .addEntityType("Abstract", { abstract: true }, () => {})
      .addEntityType("Open", { open: true }, () => {})
      .addEntityType("ExtendsOpen", { baseType: withNs("Open") }, (builder) => {
        return builder.addKeyProp("ID", ODataTypesV4.String);
      });

    const result = await doDigest();

    let toTest = result.getEntityTypes()[0];
    expect(toTest).toBeDefined();
    expect(toTest.open).toBe(false);
    expect(toTest.abstract).toBe(true);

    toTest = result.getEntityTypes()[1];
    expect(toTest).toBeDefined();
    expect(toTest.fqName).toBe(withNs("Open"));
    expect(toTest.abstract).toBe(false);
    expect(toTest.open).toBe(true);
    expect(toTest.keys.length).toBe(0);
    expect(toTest.props.length).toBe(0);

    toTest = result.getEntityTypes()[2];
    expect(toTest).toBeDefined();
    expect(toTest.fqName).toBe(withNs("ExtendsOpen"));
    expect(toTest.abstract).toBe(false);
    expect(toTest.open).toBe(true);
    expect(toTest.keys.length).toBe(1);
    expect(toTest.props.length).toBe(1);
  });

  test("support empty enums", async () => {
    odataBuilder.addEnumType("Test");

    await doDigest();
  });
}
