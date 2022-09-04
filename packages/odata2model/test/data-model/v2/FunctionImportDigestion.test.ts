import { digest } from "../../../src/data-model/DataModelDigestionV2";
import { DataTypes, OperationTypes } from "../../../src/data-model/DataTypeModel";
import { OperationType } from "../../../src/data-model/DataTypeModel";
import { ODataTypesV3 } from "../../../src/data-model/edmx/ODataEdmxModelV3";
import { EmitModes, Modes, RunOptions } from "../../../src/OptionModel";
import { ODataModelBuilderV2 } from "../builder/v2/ODataModelBuilderV2";

describe("Function Digestion Test", () => {
  const SERVICE_NAME = "FunctionTest";

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

  test("Function: min case", async () => {
    odataBuilder.addFunctionImport("GetBestFriend");

    const result = await doDigest();

    expect(result.getOperationTypeByBinding("xyz")).toEqual([]);
    expect(result.getOperationTypeByBinding("/")).toStrictEqual([
      {
        odataName: "GetBestFriend",
        name: "getBestFriend",
        paramsModelName: "GetBestFriendParams",
        type: OperationTypes.Function,
        parameters: [],
        returnType: undefined,
        usePost: false,
      } as OperationType,
    ]);
  });

  test("Function: with returnType", async () => {
    odataBuilder.addFunctionImport("getBestFriend", ODataTypesV3.Boolean);

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
    odataBuilder.addFunctionImport("GetBestFriend", ODataTypesV3.String, (builder) => {
      builder
        .addParam("test", ODataTypesV3.String, false)
        .addParam("testTruth", ODataTypesV3.Boolean)
        .addParam("testNumber", ODataTypesV3.Int16)
        .addParam("testDateTime", ODataTypesV3.DateTime);
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

    expect(result.getOperationTypeByBinding("/")).toStrictEqual([
      {
        odataName: "GetBestFriend",
        name: "getBestFriend",
        paramsModelName: "GetBestFriendParams",
        type: OperationTypes.Function,
        usePost: true,
        returnType: undefined,
        parameters: [],
      } as OperationType,
    ]);
  });
});
