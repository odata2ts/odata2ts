import { ODataVersion } from "../../src/data-model/DataTypeModel";
import { getDefaultConfig } from "../../src/defaultConfig";
import { DigesterFunction, DigestionOptions } from "../../src/FactoryFunctionModel";
import { ODataModelBuilder } from "./builder/ODataModelBuilder";

export type ModelBuilderConstructor<MB extends ODataModelBuilder<any, any, any, any>> = new (serviceName: string) => MB;

export function createDataModelTests(
  version: ODataVersion,
  ODataBuilderConstructor: ModelBuilderConstructor<any>,
  digest: DigesterFunction<any>
) {
  const SERVICE_NAME = "Tester";

  let odataBuilder: ODataModelBuilder<any, any, any, any>;
  let digestionOptions: DigestionOptions;

  beforeEach(() => {
    odataBuilder = new ODataBuilderConstructor(SERVICE_NAME);
    digestionOptions = getDefaultConfig();
  });

  test("Smoke Test", async () => {
    const result = await digest(odataBuilder.getSchema(), digestionOptions);

    expect(result).toBeTruthy();
    expect(result.getServiceName()).toBe(SERVICE_NAME);
    expect(result.getServicePrefix()).toBe(SERVICE_NAME + ".");
    expect(result.getFileNames()).toEqual({
      model: `${SERVICE_NAME}Model`,
      qObject: `Q${SERVICE_NAME}`,
      service: `${SERVICE_NAME}Service`,
    });
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

    const result = await digest(odataBuilder.getSchema(), digestionOptions);

    expect(result.getModels()[0].name).toBe("MyType");
    expect(result.getModels()[0].props[0].name).toBe("id");
    expect(result.getComplexTypes()[0].name).toBe("HomeAddress");
    expect(result.getComplexTypes()[0].props[0].name).toBe("abcDef");
    expect(result.getEnums()[0].name).toBe("FavFeat");
    expect(result.getEnums()[0].members[0]).toBe("HEY");
  });

  test("using Id of base class", async () => {
    odataBuilder
      .addEntityType("GrandParent", undefined, (builder) => {
        builder.addKeyProp("ID", "Edm.String");
      })
      .addEntityType("Parent", "GrandParent", () => {});

    const result = await digest(odataBuilder.getSchema(), digestionOptions);

    expect(result.getModels().length).toBe(2);
    expect(result.getModels()[1].name).toBe("Parent");
    expect(result.getModels()[1].idModelName).toBe("GrandParentId");
    expect(result.getModels()[1].qIdFunctionName).toBe("QGrandParentId");
    expect(result.getModels()[1].generateId).toBe(false);
  });

  test("complex Id with base class", async () => {
    odataBuilder
      .addEntityType("GrandParent", undefined, (builder) => {
        builder.addKeyProp("ID", "Edm.String");
      })
      .addEntityType("Parent", "GrandParent", (builder) => {
        builder.addKeyProp("ID2", "Edm.String");
      });

    const result = await digest(odataBuilder.getSchema(), digestionOptions);

    expect(result.getModels().length).toBe(2);
    expect(result.getModels()[1].name).toBe("Parent");
    expect(result.getModels()[1].keys.length).toBe(2);
    expect(result.getModels()[1].keyNames).toStrictEqual(["ID", "ID2"]);
    expect(result.getModels()[1].idModelName).toBe("ParentId");
    expect(result.getModels()[1].qIdFunctionName).toBe("QParentId");
    expect(result.getModels()[1].generateId).toBe(true);
  });

  test.skip("converter test", async () => {
    odataBuilder.addEntityType("Test", undefined, (builder) => {
      builder.addKeyProp("id", "Edm.String");
      builder.addProp("truth", "Edm.Boolean", false);
      builder.addProp("optionalTruth", "Edm.Boolean", true);
    });
    digestionOptions.converters = ["test"];

    // TODO: mock loadConverters method from converter-runtime
    const result = await digest(odataBuilder.getSchema(), digestionOptions);

    expect(result.getModels().length).toBe(2);
    expect(result.getModels()[1].name).toBe("Parent");
    expect(result.getModels()[1].keys.length).toBe(2);
    expect(result.getModels()[1].keyNames).toStrictEqual(["ID", "ID2"]);
    expect(result.getModels()[1].idModelName).toBe("ParentId");
    expect(result.getModels()[1].qIdFunctionName).toBe("QParentId");
    expect(result.getModels()[1].generateId).toBe(true);
  });
}
