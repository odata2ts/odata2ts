import { digest } from "../../../src/data-model/DataModelDigestionV2";
import { EmitModes, Modes, RunOptions } from "../../../src/OptionModel";
import { ODataTypesV3 } from "../../../src/data-model/edmx/ODataEdmxModelV3";
import { DataTypes, ModelTypes, PropertyModel } from "../../../src/data-model/DataTypeModel";
import { ODataModelBuilderV2 } from "../builder/v2/ODataModelBuilderV2";

const NOOP_FN = () => {};

describe("EntityTypeDigestion Test", () => {
  const SERVICE_NAME = "Tester";

  let odataBuilder: ODataModelBuilderV2;
  let runOpts: RunOptions;

  function doDigest() {
    return digest(odataBuilder.getSchema(), runOpts);
  }

  beforeEach(() => {
    odataBuilder = new ODataModelBuilderV2(SERVICE_NAME);
    runOpts = {
      mode: Modes.all,
      emitMode: EmitModes.js_dts,
      output: "ignore",
      prettier: false,
      debug: false,
      modelPrefix: "",
      modelSuffix: "",
    };
  });

  test("EntityTypes: simple entity", async () => {
    odataBuilder.addEntityType("min", undefined, (builder) => {
      builder.addKeyProp("id", ODataTypesV3.String);
    });

    const result = await doDigest();

    expect(result.getModels().length).toBe(1);
    const model = result.getModels()[0];
    // expect(model).toEqual({});
    expect(model).toMatchObject({
      modelType: ModelTypes.EntityType,
      name: "Min",
      odataName: "min",
      qName: "qMin",
      baseClasses: [],
      baseProps: [],
      keyNames: ["id"],
    });
    expect(model.keys.length).toBe(1);
    expect(model.getKeyUnion()).toBe("id");
    expect(model.props.length).toBe(1);

    const expectedProp = {
      dataType: DataTypes.PrimitiveType,
      isCollection: false,
      name: "id",
      odataName: "id",
      odataType: ODataTypesV3.String,
      qObject: undefined,
      required: true,
      type: "string",
    };
    expect(model.keys[0]).toMatchObject(expectedProp);
    expect(model.props[0]).toMatchObject(expectedProp);
  });

  test("EntityTypes: fail without key prop", async () => {
    odataBuilder.addEntityType("test", undefined, NOOP_FN);

    await expect(doDigest()).rejects.toThrowError("Key property is missing");
  });

  test("EntityTypes: fail unknown prop type", async () => {
    odataBuilder.addEntityType("test", undefined, (builder) => builder.addKeyProp("id", "PinkPanther"));

    await expect(doDigest()).rejects.toThrowError("Unknown type [PinkPanther]");
  });

  test("EntityTypes: fail key without prop", async () => {
    odataBuilder.addEntityType("test", undefined, (builder) => builder.addKeyOnly("id"));

    await expect(doDigest()).rejects.toThrowError("[id] not found in props");
  });

  test("EntityTypes: fail prop without type", async () => {
    odataBuilder.addEntityType("test", undefined, (builder) => {
      // @ts-ignore
      builder.addKeyProp("id", undefined);
    });

    await expect(doDigest()).rejects.toThrowError("No type information given for property [id]");
  });

  test("EntityTypes: composite keys", async () => {
    odataBuilder.addEntityType("CompoKey", undefined, (builder) => {
      builder
        .addKeyProp("cat", ODataTypesV3.String)
        .addKeyProp("subCat", ODataTypesV3.String)
        .addKeyProp("counter", ODataTypesV3.Int16);
    });

    const dataModel = await doDigest();
    const model = dataModel.getModel("CompoKey");

    expect(model).toMatchObject({
      keyNames: ["cat", "subCat", "counter"],
      keys: [
        {
          name: "cat",
          type: "string",
        },
        {
          name: "subCat",
        },
        { name: "counter", type: "number" },
      ],
    });
    expect(model.props.length).toBe(3);
  });

  test("EntityTypes: base class hierarchy", async () => {
    odataBuilder.addEntityType("GrandParent", undefined, (builder) => builder.addKeyProp("id", ODataTypesV3.Guid));
    odataBuilder.addEntityType("Parent", "GrandParent", (builder) =>
      builder.addProp("parentalAdvice", ODataTypesV3.Boolean)
    );
    odataBuilder.addEntityType("Child", "Parent", (builder) => builder.addProp("Ch1ld1shF4n", ODataTypesV3.String));

    const expectedGrandParentProp = {
      dataType: DataTypes.PrimitiveType,
      name: "id",
      odataType: ODataTypesV3.Guid,
      required: true,
      type: "GuidString",
    };
    const expectedParentProp = {
      dataType: DataTypes.PrimitiveType,
      name: "parentalAdvice",
      odataType: ODataTypesV3.Boolean,
      type: "boolean",
    };
    const expectedChildProp = {
      dataType: DataTypes.PrimitiveType,
      name: "ch1ld1shF4n",
      odataType: ODataTypesV3.String,
      type: "string",
    };

    const result = await doDigest();

    expect(result.getModels().length).toBe(3);
    expect(result.getModel("GrandParent")).toMatchObject({
      name: "GrandParent",
      odataName: "GrandParent",
      keyNames: ["id"],
      props: [expectedGrandParentProp],
      baseClasses: [],
      baseProps: [],
    });
    expect(result.getModel("Parent")).toMatchObject({
      name: "Parent",
      keyNames: ["id"],
      props: [expectedParentProp],
      baseClasses: ["GrandParent"],
      baseProps: [expectedGrandParentProp],
    });
    expect(result.getModel("Child")).toMatchObject({
      name: "Child",
      keyNames: ["id"],
      props: [expectedChildProp],
      baseClasses: ["Parent"],
      baseProps: [expectedGrandParentProp, expectedParentProp],
    });
  });

  test("EntityTypes: max prop types", async () => {
    odataBuilder.addEntityType("max", undefined, (builder) =>
      builder
        .addKeyProp("ID", ODataTypesV3.Guid)
        .addProp("isTrue", ODataTypesV3.Boolean, false)
        .addProp("time", ODataTypesV3.Time)
        .addProp("optionalDate", ODataTypesV3.DateTime)
        .addProp("dateTimeOffset", ODataTypesV3.DateTimeOffset)
        .addProp("TestInt16", ODataTypesV3.Int16)
        .addProp("TestInt32", ODataTypesV3.Int32)
        .addProp("TestInt64", ODataTypesV3.Int64)
        .addProp("TestDecimal", ODataTypesV3.Decimal)
        .addProp("TestDouble", ODataTypesV3.Double)
        .addProp("testByte", ODataTypesV3.Byte)
        .addProp("testSByte", ODataTypesV3.SByte)
        .addProp("testSingle", ODataTypesV3.Single)
        .addProp("testBinary", ODataTypesV3.Binary)
        .addProp("testAny", "Edm.AnythingYouWant")
    );
    const result = await digest(odataBuilder.getSchema(), runOpts);

    // check needed imports for special primitive types
    expect(result.getPrimitiveTypeImports()).toEqual([
      "GuidString",
      "TimeV2String",
      "DateTimeV2String",
      "DateTimeOffsetV2String",
      "BinaryString",
    ]);

    // now check all props regarding their type
    const model = result.getModel("Max");
    expect(model.props).toMatchObject([
      { name: "id" },
      {
        name: "isTrue",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV3.Boolean,
        type: "boolean",
        required: true,
      },
      {
        name: "time",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV3.Time,
        type: "TimeV2String",
        required: false,
      },
      {
        name: "optionalDate",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV3.DateTime,
        type: "DateTimeV2String",
        required: false,
      },
      {
        name: "dateTimeOffset",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV3.DateTimeOffset,
        type: "DateTimeOffsetV2String",
      },
      {
        name: "testInt16",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV3.Int16,
        type: "number",
      },
      {
        name: "testInt32",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV3.Int32,
        type: "number",
      },
      {
        name: "testInt64",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV3.Int64,
        type: "string",
      },
      {
        name: "testDecimal",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV3.Decimal,
        type: "string",
      },
      {
        name: "testDouble",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV3.Double,
        type: "string",
      },
      {
        name: "testByte",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV3.Byte,
        type: "string",
      },
      {
        name: "testSByte",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV3.SByte,
        type: "string",
      },
      {
        name: "testSingle",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV3.Single,
        type: "string",
      },
      {
        name: "testBinary",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV3.Binary,
        type: "BinaryString",
      },
      {
        name: "testAny",
        dataType: DataTypes.PrimitiveType,
        odataType: "Edm.AnythingYouWant",
        type: "string",
      },
    ]);
  });

  test("EntityTypes: navProps", async () => {
    const relationshipCat = "Product_Category";
    const relationshipSupp = "Product_Supplier";
    odataBuilder
      .addEntityType("Product", undefined, (builder) =>
        builder
          .addKeyProp("ID", ODataTypesV3.Guid)
          .addNavProp("Category", `${SERVICE_NAME}.Category`, relationshipCat, "1")
          .addNavProp("supplier", `${SERVICE_NAME}.Supplier`, relationshipSupp, "0..1")
      )
      .addEntityType("Category", undefined, (builder) =>
        builder
          .addKeyProp("ID", ODataTypesV3.Guid)
          .addNavProp("products", `${SERVICE_NAME}.Product`, relationshipCat, "*")
      )
      .addEntityType("Supplier", undefined, (builder) =>
        builder
          .addKeyProp("ID", ODataTypesV3.Guid)
          .addNavProp("products", `${SERVICE_NAME}.Product`, relationshipSupp, "*")
      );

    const result = await digest(odataBuilder.getSchema(), runOpts);

    expect(result.getModels().length).toBe(3);

    const product = result.getModels()[0];
    expect(product.props.length).toBe(3);
    expect(product.props[1]).toEqual({
      name: "category",
      odataName: "Category",
      qObject: "qCategory",
      type: "Category",
      odataType: `${SERVICE_NAME}.Category`,
      isCollection: false,
      dataType: DataTypes.ModelType,
      required: true,
    } as PropertyModel);
    expect(product.props[2]).toEqual({
      name: "supplier",
      odataName: "supplier",
      qObject: "qSupplier",
      type: "Supplier",
      odataType: `${SERVICE_NAME}.Supplier`,
      isCollection: false,
      dataType: DataTypes.ModelType,
      required: false,
    } as PropertyModel);

    const category = result.getModels()[1];
    expect(category.props.length).toBe(2);
    expect(category.props[1]).toEqual({
      name: "products",
      odataName: "products",
      qObject: "qProduct",
      type: "Product",
      odataType: `Collection(${SERVICE_NAME}.Product)`,
      isCollection: true,
      dataType: DataTypes.ModelType,
      required: false,
    } as PropertyModel);
  });
});
