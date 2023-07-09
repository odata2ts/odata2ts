import { ODataTypesV2 } from "@odata2ts/odata-core";

import { digest } from "../../../src/data-model/DataModelDigestionV2";
import { DataTypes, PropertyModel } from "../../../src/data-model/DataTypeModel";
import { NamingHelper } from "../../../src/data-model/NamingHelper";
import { getTestConfig } from "../../test.config";
import { ODataModelBuilderV2 } from "../builder/v2/ODataModelBuilderV2";

const NOOP_FN = () => {};

describe("V2: EntityTypeDigestion Test", () => {
  const SERVICE_NAME = "Tester";
  const CONFIG = getTestConfig();
  const NAMING_HELPER = new NamingHelper(CONFIG, SERVICE_NAME);

  let odataBuilder: ODataModelBuilderV2;

  function doDigest() {
    return digest(odataBuilder.getSchemas(), CONFIG, NAMING_HELPER);
  }

  beforeEach(() => {
    odataBuilder = new ODataModelBuilderV2(SERVICE_NAME);
  });

  test("EntityTypes: simple entity", async () => {
    odataBuilder.addEntityType("min", undefined, (builder) => {
      builder.addKeyProp("id", ODataTypesV2.String);
    });

    const result = await doDigest();

    expect(result.getModels().length).toBe(1);
    const model = result.getModels()[0];
    // expect(model).toEqual({});
    expect(model).toMatchObject({
      name: "Min",
      odataName: "min",
      qName: "QMin",
      idModelName: "MinId",
      qIdFunctionName: "QMinId",
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
      odataType: ODataTypesV2.String,
      qObject: undefined,
      qPath: "QStringV2Path",
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
        .addKeyProp("cat", ODataTypesV2.String)
        .addKeyProp("subCat", ODataTypesV2.String)
        .addKeyProp("counter", ODataTypesV2.Int16);
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
    odataBuilder.addEntityType("GrandParent", undefined, (builder) => builder.addKeyProp("id", ODataTypesV2.Guid));
    odataBuilder.addEntityType("Parent", "GrandParent", (builder) =>
      builder.addProp("parentalAdvice", ODataTypesV2.Boolean)
    );
    odataBuilder.addEntityType("Child", "Parent", (builder) => builder.addProp("Ch1ld1shF4n", ODataTypesV2.String));

    const expectedGrandParentProp = {
      dataType: DataTypes.PrimitiveType,
      name: "id",
      odataType: ODataTypesV2.Guid,
      required: true,
      type: "string",
    };
    const expectedParentProp = {
      dataType: DataTypes.PrimitiveType,
      name: "parentalAdvice",
      odataType: ODataTypesV2.Boolean,
      type: "boolean",
    };
    const expectedChildProp = {
      dataType: DataTypes.PrimitiveType,
      name: "ch1ld1shF4n",
      odataType: ODataTypesV2.String,
      type: "string",
    };

    const result = await doDigest();

    expect(result.getModels().length).toBe(3);
    expect(result.getModel("GrandParent")).toMatchObject({
      name: "GrandParent",
      odataName: "GrandParent",
      idModelName: "GrandParentId",
      qIdFunctionName: "QGrandParentId",
      generateId: true,
      keyNames: ["id"],
      props: [expectedGrandParentProp],
      baseClasses: [],
      baseProps: [],
    });
    expect(result.getModel("Parent")).toMatchObject({
      name: "Parent",
      idModelName: "GrandParentId",
      qIdFunctionName: "QGrandParentId",
      generateId: false,
      keyNames: ["id"],
      props: [expectedParentProp],
      baseClasses: ["GrandParent"],
      baseProps: [expectedGrandParentProp],
    });
    expect(result.getModel("Child")).toMatchObject({
      name: "Child",
      idModelName: "GrandParentId",
      qIdFunctionName: "QGrandParentId",
      generateId: false,
      keyNames: ["id"],
      props: [expectedChildProp],
      baseClasses: ["Parent"],
      baseProps: [expectedGrandParentProp, expectedParentProp],
    });
  });

  test("EntityTypes: max prop types", async () => {
    odataBuilder.addEntityType("max", undefined, (builder) =>
      builder
        .addKeyProp("ID", ODataTypesV2.Guid)
        .addProp("isTrue", ODataTypesV2.Boolean, false)
        .addProp("time", ODataTypesV2.Time)
        .addProp("optionalDate", ODataTypesV2.DateTime)
        .addProp("dateTimeOffset", ODataTypesV2.DateTimeOffset)
        .addProp("TestInt16", ODataTypesV2.Int16)
        .addProp("TestInt32", ODataTypesV2.Int32)
        .addProp("TestInt64", ODataTypesV2.Int64)
        .addProp("TestDecimal", ODataTypesV2.Decimal)
        .addProp("TestDouble", ODataTypesV2.Double)
        .addProp("testByte", ODataTypesV2.Byte)
        .addProp("testSByte", ODataTypesV2.SByte)
        .addProp("testSingle", ODataTypesV2.Single)
        .addProp("testBinary", ODataTypesV2.Binary)
        .addProp("testAny", "Edm.AnythingYouWant")
        .addProp("multipleIds", `Collection(${ODataTypesV2.Guid})`)
        .addProp("multipleStrings", `Collection(${ODataTypesV2.String})`)
        .addProp("multipleNumbers", `Collection(${ODataTypesV2.Decimal})`)
        .addProp("multipleBooleans", `Collection(${ODataTypesV2.Boolean})`)
        .addProp("multipleTimes", `Collection(${ODataTypesV2.Time})`)
        .addProp("multipleDateTimes", `Collection(${ODataTypesV2.DateTime})`)
        .addProp("multipleDateTimeOffsets", `Collection(${ODataTypesV2.DateTimeOffset})`)
        .addProp("multipleBinaries", `Collection(${ODataTypesV2.Binary})`)
    );
    const result = await doDigest();

    // now check all props regarding their type
    const model = result.getModel("Max");
    expect(model.props).toMatchObject([
      {
        name: "id",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV2.Guid,
        type: "string",
        required: true,
        qObject: undefined,
        qPath: "QGuidV2Path",
      },
      {
        name: "isTrue",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV2.Boolean,
        type: "boolean",
        required: true,
        qObject: undefined,
        qPath: "QBooleanPath",
      },
      {
        name: "time",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV2.Time,
        type: "string",
        required: false,
        qObject: undefined,
        qPath: "QTimeV2Path",
      },
      {
        name: "optionalDate",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV2.DateTime,
        type: "string",
        required: false,
        qObject: undefined,
        qPath: "QDateTimeV2Path",
      },
      {
        name: "dateTimeOffset",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV2.DateTimeOffset,
        type: "string",
        qObject: undefined,
        qPath: "QDateTimeOffsetV2Path",
      },
      {
        name: "testInt16",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV2.Int16,
        type: "number",
        qObject: undefined,
        qPath: "QNumberV2Path",
        qParam: "QNumberParam",
      },
      {
        name: "testInt32",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV2.Int32,
        type: "number",
        qObject: undefined,
        qPath: "QNumberV2Path",
        qParam: "QNumberParam",
      },
      {
        name: "testInt64",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV2.Int64,
        type: "string",
        qObject: undefined,
        qPath: "QStringNumberV2Path",
        qParam: "QInt64V2Param",
      },
      {
        name: "testDecimal",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV2.Decimal,
        type: "string",
        qObject: undefined,
        qPath: "QStringNumberV2Path",
        qParam: "QDecimalV2Param",
      },
      {
        name: "testDouble",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV2.Double,
        type: "string",
        qObject: undefined,
        qPath: "QStringNumberV2Path",
        qParam: "QDoubleV2Param",
      },
      {
        name: "testByte",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV2.Byte,
        type: "string",
        qObject: undefined,
        qPath: "QStringNumberV2Path",
        qParam: "QStringNumberV2Param",
      },
      {
        name: "testSByte",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV2.SByte,
        type: "string",
        qObject: undefined,
        qPath: "QStringNumberV2Path",
        qParam: "QStringNumberV2Param",
      },
      {
        name: "testSingle",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV2.Single,
        type: "string",
        qObject: undefined,
        qPath: "QStringNumberV2Path",
        qParam: "QSingleV2Param",
      },
      {
        name: "testBinary",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV2.Binary,
        type: "string",
        qObject: undefined,
        qPath: "QBinaryPath",
      },
      {
        name: "testAny",
        dataType: DataTypes.PrimitiveType,
        odataType: "Edm.AnythingYouWant",
        type: "string",
        qObject: undefined,
        qPath: "QStringV2Path",
      },
      {
        name: "multipleIds",
        dataType: DataTypes.PrimitiveType,
        odataType: `Collection(${ODataTypesV2.Guid})`,
        type: "string",
        isCollection: true,
        qObject: "QGuidV2Collection",
        qPath: "QGuidV2Path",
      },
      {
        name: "multipleStrings",
        odataType: `Collection(${ODataTypesV2.String})`,
        type: "string",
        isCollection: true,
        qObject: "QStringV2Collection",
        qPath: "QStringV2Path",
      },
      {
        name: "multipleNumbers",
        odataType: `Collection(${ODataTypesV2.Decimal})`,
        type: "string",
        isCollection: true,
        qObject: "QStringNumberV2Collection",
        qPath: "QStringNumberV2Path",
      },
      {
        name: "multipleBooleans",
        odataType: `Collection(${ODataTypesV2.Boolean})`,
        type: "boolean",
        isCollection: true,
        qObject: "QBooleanCollection",
        qPath: "QBooleanPath",
      },
      {
        name: "multipleTimes",
        odataType: `Collection(${ODataTypesV2.Time})`,
        type: "string",
        isCollection: true,
        qObject: "QTimeV2Collection",
        qPath: "QTimeV2Path",
      },
      {
        name: "multipleDateTimes",
        odataType: `Collection(${ODataTypesV2.DateTime})`,
        type: "string",
        isCollection: true,
        qObject: "QDateTimeV2Collection",
        qPath: "QDateTimeV2Path",
      },
      {
        name: "multipleDateTimeOffsets",
        odataType: `Collection(${ODataTypesV2.DateTimeOffset})`,
        type: "string",
        isCollection: true,
        qObject: "QDateTimeOffsetV2Collection",
        qPath: "QDateTimeOffsetV2Path",
      },
      {
        name: "multipleBinaries",
        odataType: `Collection(${ODataTypesV2.Binary})`,
        type: "string",
        isCollection: true,
        qObject: "QBinaryCollection",
        qPath: "QBinaryPath",
      },
    ]);
  });

  test("EntityTypes: navProps", async () => {
    const relationshipCat = "Product_Category";
    const relationshipSupp = "Product_Supplier";
    odataBuilder
      .addEntityType("Product", undefined, (builder) =>
        builder
          .addKeyProp("ID", ODataTypesV2.Guid)
          .addNavProp("Category", `${SERVICE_NAME}.Category`, relationshipCat, "1")
          .addNavProp("supplier", `${SERVICE_NAME}.Supplier`, relationshipSupp, "0..1")
      )
      .addEntityType("Category", undefined, (builder) =>
        builder
          .addKeyProp("ID", ODataTypesV2.Guid)
          .addNavProp("products", `${SERVICE_NAME}.Product`, relationshipCat, "*")
      )
      .addEntityType("Supplier", undefined, (builder) =>
        builder
          .addKeyProp("ID", ODataTypesV2.Guid)
          .addNavProp("products", `${SERVICE_NAME}.Product`, relationshipSupp, "*")
      );

    const result = await doDigest();

    expect(result.getModels().length).toBe(3);

    const product = result.getModels()[0];
    expect(product.props.length).toBe(3);
    expect(product.props[1]).toEqual({
      name: "category",
      odataName: "Category",
      qObject: "QCategory",
      qPath: "QEntityPath",
      qParam: "QComplexParam",
      type: "Category",
      odataType: `${SERVICE_NAME}.Category`,
      isCollection: false,
      dataType: DataTypes.ModelType,
      managed: undefined,
      required: true,
    } as PropertyModel);
    expect(product.props[2]).toEqual({
      name: "supplier",
      odataName: "supplier",
      qObject: "QSupplier",
      qPath: "QEntityPath",
      qParam: "QComplexParam",
      type: "Supplier",
      odataType: `${SERVICE_NAME}.Supplier`,
      isCollection: false,
      dataType: DataTypes.ModelType,
      managed: undefined,
      required: false,
    } as PropertyModel);

    const category = result.getModels()[1];
    expect(category.props.length).toBe(2);
    expect(category.props[1]).toEqual({
      name: "products",
      odataName: "products",
      qObject: "QProduct",
      qPath: "QEntityPath",
      qParam: "QComplexParam",
      type: "Product",
      odataType: `Collection(${SERVICE_NAME}.Product)`,
      isCollection: true,
      dataType: DataTypes.ModelType,
      managed: undefined,
      required: false,
    } as PropertyModel);
  });
});
