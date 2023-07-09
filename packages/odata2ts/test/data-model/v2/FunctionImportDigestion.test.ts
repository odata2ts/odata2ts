import { ODataTypesV2 } from "@odata2ts/odata-core";

import { digest } from "../../../src/data-model/DataModelDigestionV2";
import { DataTypes, OperationTypes } from "../../../src/data-model/DataTypeModel";
import { OperationType } from "../../../src/data-model/DataTypeModel";
import { NamingHelper } from "../../../src/data-model/NamingHelper";
import { getTestConfig } from "../../test.config";
import { ODataModelBuilderV2 } from "../builder/v2/ODataModelBuilderV2";

describe("Function Digestion Test", () => {
  const SERVICE_NAME = "FunctionTest";
  const CONFIG = getTestConfig();
  const NAMING_HELPER = new NamingHelper(CONFIG, SERVICE_NAME);

  let odataBuilder: ODataModelBuilderV2;

  function doDigest() {
    return digest(odataBuilder.getSchemas(), CONFIG, NAMING_HELPER);
  }

  beforeEach(() => {
    odataBuilder = new ODataModelBuilderV2(SERVICE_NAME);
  });

  test("Function: min case", async () => {
    odataBuilder.addFunctionImport("GetBestFriend");

    const result = await doDigest();

    expect(result.getOperationTypeByBinding("xyz")).toEqual([]);
    expect(result.getOperationTypeByBinding("/")).toStrictEqual([
      {
        odataName: "GetBestFriend",
        name: "getBestFriend",
        qName: "QGetBestFriend",
        paramsModelName: "GetBestFriendParams",
        type: OperationTypes.Function,
        parameters: [],
        returnType: undefined,
        usePost: false,
      } as OperationType,
    ]);
  });

  test("Function: with returnType", async () => {
    odataBuilder.addFunctionImport("getBestFriend", ODataTypesV2.Boolean);

    const result = await doDigest();

    expect(result.getOperationTypeByBinding("/")).toMatchObject([
      {
        odataName: "getBestFriend",
        name: "getBestFriend",
        returnType: {
          dataType: DataTypes.PrimitiveType,
          name: "noNameBecauseReturnType",
          odataName: "NO_NAME_BECAUSE_RETURN_TYPE",
          odataType: "Edm.Boolean",
          type: "boolean",
          qObject: undefined,
          required: false,
          isCollection: false,
        },
      },
    ]);
  });

  test("Function: with params", async () => {
    odataBuilder.addFunctionImport("GetBestFriend", ODataTypesV2.String, (builder) => {
      builder
        .addParam("test", ODataTypesV2.String, false)
        .addParam("testTruth", ODataTypesV2.Boolean)
        .addParam("testNumber", ODataTypesV2.Int16)
        .addParam("testDateTime", ODataTypesV2.DateTime);
    });

    const result = await doDigest();

    expect(result.getOperationTypeByBinding("/")).toMatchObject([
      {
        odataName: "GetBestFriend",
        parameters: [
          {
            name: "test",
            type: "string",
          },
          {
            name: "testTruth",
            type: "boolean",
          },
          {
            name: "testNumber",
            type: "number",
          },
          {
            name: "testDateTime",
            type: "string",
          },
        ],
        returnType: {
          dataType: DataTypes.PrimitiveType,
          name: "noNameBecauseReturnType",
          odataName: "NO_NAME_BECAUSE_RETURN_TYPE",
          odataType: "Edm.String",
          type: "string",
          qObject: undefined,
          required: false,
          isCollection: false,
        },
      },
    ]);
  });

  test("Function: returning EntitySet", async () => {
    odataBuilder
      .addFunctionImport("listProducts", `Collection(${SERVICE_NAME}.Product)`)
      .addEntityType("Product", undefined, (builder) => {
        builder.addKeyProp("id", "Edm.Guid");
      });

    const result = await doDigest();

    expect(result.getOperationTypeByBinding("/")).toMatchObject([
      {
        name: "listProducts",
        type: OperationTypes.Function,
        parameters: [],
        returnType: {
          isCollection: true,
          dataType: DataTypes.ModelType,
          name: "noNameBecauseReturnType",
          odataName: "NO_NAME_BECAUSE_RETURN_TYPE",
          odataType: `Collection(${SERVICE_NAME}.Product)`,
          type: "Product",
          qObject: "QProduct",
        },
      },
    ]);
  });

  test("Function: POST method", async () => {
    odataBuilder.addFunctionImport("GetBestFriend", undefined, undefined, true);

    const result = await doDigest();

    expect(result.getUnboundOperationTypes()).toStrictEqual([
      {
        odataName: "GetBestFriend",
        name: "getBestFriend",
        qName: "QGetBestFriend",
        paramsModelName: "GetBestFriendParams",
        type: OperationTypes.Function,
        usePost: true,
        returnType: undefined,
        parameters: [],
      } as OperationType,
    ]);
  });

  test("Function: with complex and enum params", async () => {
    odataBuilder
      .addComplexType("Complex", undefined, (builder) => builder.addProp("a", ODataTypesV2.String))
      .addEntityType("TheEntity", undefined, (builder) => builder.addKeyProp("id", ODataTypesV2.String))
      .addEnumType("TheEnum", [{ name: "One", value: 1 }])
      .addFunctionImport("test", ODataTypesV2.String, (builder) => {
        return builder
          .addParam("complex", `${SERVICE_NAME}.Complex`)
          .addParam("entity", `${SERVICE_NAME}.TheEntity`)
          .addParam("enum", `${SERVICE_NAME}.TheEnum`);
      });

    const result = await doDigest();

    expect(result.getUnboundOperationTypes()).toMatchObject([
      {
        name: "test",
        qName: "QTest",
        paramsModelName: "TestParams",
        type: OperationTypes.Function,
        parameters: [
          {
            name: "complex",
            type: "Complex",
            qParam: "QComplexParam",
          },
          {
            name: "entity",
            type: "TheEntity",
            qParam: "QComplexParam",
          },
          {
            name: "enum",
            type: "TheEnum",
            qParam: "QEnumParam",
          },
        ],
      },
    ]);
  });
});
