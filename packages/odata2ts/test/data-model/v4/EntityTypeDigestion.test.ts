import { ODataTypesV4 } from "@odata2ts/odata-core";

import { digest } from "../../../src/data-model/DataModelDigestionV4";
import { DataTypes } from "../../../src/data-model/DataTypeModel";
import { NamingHelper } from "../../../src/data-model/NamingHelper";
import { getTestConfig } from "../../test.config";
import { ODataModelBuilderV4 } from "../builder/v4/ODataModelBuilderV4";

const NOOP_FN = () => {};

describe("V4: EntityTypeDigestion Test", () => {
  const SERVICE_NAME = "Tester";
  const CONFIG = getTestConfig();
  const NAMING_HELPER = new NamingHelper(CONFIG, SERVICE_NAME);

  let odataBuilder: ODataModelBuilderV4;

  function doDigest() {
    return digest(odataBuilder.getSchemas(), CONFIG, NAMING_HELPER);
  }

  beforeEach(() => {
    odataBuilder = new ODataModelBuilderV4(SERVICE_NAME);
  });

  test("EntityTypes: simple entity", async () => {
    odataBuilder.addEntityType("min", undefined, (builder) => {
      builder.addKeyProp("id", ODataTypesV4.String);
    });

    const result = await doDigest();

    expect(result.getModels().length).toBe(1);
    const model = result.getModels()[0];
    // expect(model).toEqual({});
    expect(model).toMatchObject({
      name: "Min",
      odataName: "min",
      qName: "QMin",
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
      managed: true,
      name: "id",
      odataName: "id",
      odataType: ODataTypesV4.String,
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
        .addKeyProp("cat", ODataTypesV4.String)
        .addKeyProp("subCat", ODataTypesV4.String)
        .addKeyProp("counter", ODataTypesV4.Int16);
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
    odataBuilder.addEntityType("GrandParent", undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.Guid));
    odataBuilder.addEntityType("Parent", "GrandParent", (builder) =>
      builder.addProp("parentalAdvice", ODataTypesV4.Boolean)
    );
    odataBuilder.addEntityType("Child", "Parent", (builder) => builder.addProp("Ch1ld1shF4n", ODataTypesV4.String));

    const expectedGrandParentProp = {
      dataType: DataTypes.PrimitiveType,
      name: "id",
      odataType: ODataTypesV4.Guid,
      required: true,
      type: "string",
    };
    const expectedParentProp = {
      dataType: DataTypes.PrimitiveType,
      name: "parentalAdvice",
      odataType: ODataTypesV4.Boolean,
      type: "boolean",
    };
    const expectedChildProp = {
      dataType: DataTypes.PrimitiveType,
      name: "ch1ld1shF4n",
      odataType: ODataTypesV4.String,
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
        .addKeyProp("ID", ODataTypesV4.Guid)
        .addProp("isTrue", ODataTypesV4.Boolean, false)
        .addProp("time", ODataTypesV4.TimeOfDay)
        .addProp("optionalDate", ODataTypesV4.Date)
        .addProp("dateTimeOffset", ODataTypesV4.DateTimeOffset)
        .addProp("TestInt16", ODataTypesV4.Int16)
        .addProp("TestInt32", ODataTypesV4.Int32)
        .addProp("TestInt64", ODataTypesV4.Int64)
        .addProp("TestDecimal", ODataTypesV4.Decimal)
        .addProp("TestDouble", ODataTypesV4.Double)
        .addProp("testByte", ODataTypesV4.Byte)
        .addProp("testSByte", ODataTypesV4.SByte)
        .addProp("testSingle", ODataTypesV4.Single)
        .addProp("testBinary", ODataTypesV4.Binary)
        .addProp("testAny", "Edm.AnythingYouWant")
        .addProp("multipleIds", `Collection(${ODataTypesV4.Guid})`)
        .addProp("multipleStrings", `Collection(${ODataTypesV4.String})`)
        .addProp("multipleNumbers", `Collection(${ODataTypesV4.Decimal})`)
        .addProp("multipleBooleans", `Collection(${ODataTypesV4.Boolean})`)
        .addProp("multipleTimes", `Collection(${ODataTypesV4.TimeOfDay})`)
        .addProp("multipleDates", `Collection(${ODataTypesV4.Date})`)
        .addProp("multipleDateTimes", `Collection(${ODataTypesV4.DateTimeOffset})`)
        .addProp("multipleBinaries", `Collection(${ODataTypesV4.Binary})`)
    );
    const result = await doDigest();

    // now check all props regarding their type
    const model = result.getModel("Max");
    expect(model.props).toMatchObject([
      {
        name: "id",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV4.Guid,
        type: "string",
        required: true,
        qObject: undefined,
        qPath: "QGuidPath",
      },
      {
        name: "isTrue",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV4.Boolean,
        type: "boolean",
        required: true,
        qObject: undefined,
        qPath: "QBooleanPath",
      },
      {
        name: "time",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV4.TimeOfDay,
        type: "string",
        required: false,
        qObject: undefined,
        qPath: "QTimeOfDayPath",
      },
      {
        name: "optionalDate",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV4.Date,
        type: "string",
        required: false,
        qObject: undefined,
        qPath: "QDatePath",
      },
      {
        name: "dateTimeOffset",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV4.DateTimeOffset,
        type: "string",
        qObject: undefined,
        qPath: "QDateTimeOffsetPath",
      },
      {
        name: "testInt16",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV4.Int16,
        type: "number",
        qObject: undefined,
        qPath: "QNumberPath",
      },
      {
        name: "testInt32",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV4.Int32,
        type: "number",
        qObject: undefined,
        qPath: "QNumberPath",
      },
      {
        name: "testInt64",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV4.Int64,
        type: "number",
        qObject: undefined,
        qPath: "QNumberPath",
      },
      {
        name: "testDecimal",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV4.Decimal,
        type: "number",
        qObject: undefined,
        qPath: "QNumberPath",
      },
      {
        name: "testDouble",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV4.Double,
        type: "number",
        qObject: undefined,
        qPath: "QNumberPath",
      },
      {
        name: "testByte",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV4.Byte,
        type: "number",
        qObject: undefined,
        qPath: "QNumberPath",
      },
      {
        name: "testSByte",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV4.SByte,
        type: "number",
        qObject: undefined,
        qPath: "QNumberPath",
      },
      {
        name: "testSingle",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV4.Single,
        type: "number",
        qObject: undefined,
        qPath: "QNumberPath",
      },
      {
        name: "testBinary",
        dataType: DataTypes.PrimitiveType,
        odataType: ODataTypesV4.Binary,
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
        qPath: "QStringPath",
      },
      {
        name: "multipleIds",
        dataType: DataTypes.PrimitiveType,
        odataType: `Collection(${ODataTypesV4.Guid})`,
        type: "string",
        isCollection: true,
        qObject: "QGuidCollection",
        qPath: "QGuidPath",
      },
      {
        name: "multipleStrings",
        odataType: `Collection(${ODataTypesV4.String})`,
        type: "string",
        isCollection: true,
        qObject: "QStringCollection",
        qPath: "QStringPath",
      },
      {
        name: "multipleNumbers",
        odataType: `Collection(${ODataTypesV4.Decimal})`,
        type: "number",
        isCollection: true,
        qObject: "QNumberCollection",
        qPath: "QNumberPath",
      },
      {
        name: "multipleBooleans",
        odataType: `Collection(${ODataTypesV4.Boolean})`,
        type: "boolean",
        isCollection: true,
        qObject: "QBooleanCollection",
        qPath: "QBooleanPath",
      },
      {
        name: "multipleTimes",
        odataType: `Collection(${ODataTypesV4.TimeOfDay})`,
        type: "string",
        isCollection: true,
        qObject: "QTimeOfDayCollection",
        qPath: "QTimeOfDayPath",
      },
      {
        name: "multipleDates",
        odataType: `Collection(${ODataTypesV4.Date})`,
        type: "string",
        isCollection: true,
        qObject: "QDateCollection",
        qPath: "QDatePath",
      },
      {
        name: "multipleDateTimes",
        odataType: `Collection(${ODataTypesV4.DateTimeOffset})`,
        type: "string",
        isCollection: true,
        qObject: "QDateTimeOffsetCollection",
        qPath: "QDateTimeOffsetPath",
      },
      {
        name: "multipleBinaries",
        odataType: `Collection(${ODataTypesV4.Binary})`,
        type: "string",
        isCollection: true,
        qObject: "QBinaryCollection",
        qPath: "QBinaryPath",
      },
    ]);
  });

  test("EntityTypes: navProps with entity & entity collection", async () => {
    odataBuilder
      .addEntityType("Category", undefined, (builder) => {
        builder
          .addKeyProp("ID", ODataTypesV4.Guid)
          .addNavProp("bestProduct", `${SERVICE_NAME}.Product`)
          .addNavProp("featuredProducts", `Collection(${SERVICE_NAME}.Product)`);
      })
      .addEntityType("Product", undefined, (builder) => {
        builder.addKeyProp("ID", ODataTypesV4.Guid);
      });

    const result = await doDigest();
    const model = result.getModel("Category");

    expect(model.props[1]).toMatchObject({
      dataType: DataTypes.ModelType,
      isCollection: false,
      name: "bestProduct",
      odataName: "bestProduct",
      odataType: `${SERVICE_NAME}.Product`,
      qObject: "QProduct",
      type: "Product",
    });
    expect(model.props[2]).toMatchObject({
      dataType: DataTypes.ModelType,
      isCollection: true,
      name: "featuredProducts",
      odataName: "featuredProducts",
      odataType: `Collection(${SERVICE_NAME}.Product)`,
      qObject: "QProduct",
      type: "Product",
    });
  });

  test("EntityTypes: navProps", async () => {
    odataBuilder
      .addEntityType("max", undefined, (builder) =>
        builder
          .addKeyProp("ID", ODataTypesV4.Guid)
          .addNavProp("products", `${SERVICE_NAME}.Product`)
          .addNavProp("similarProducts", `${SERVICE_NAME}.Prod.uct`, "test", false)
      )
      .addEntityType("Product", undefined, (builder) => {
        builder.addKeyProp("ID", ODataTypesV4.Guid);
      })
      .addEntityType("Prod.uct", undefined, (builder) => {
        builder.addKeyProp("ID", ODataTypesV4.Guid);
      });

    const result = await doDigest();

    expect(result.getModels().length).toBe(3);
  });
});
