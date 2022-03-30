import { ODataModelBuilder, ODataVersion } from "./builder/ODataModelBuilder";
import { digest } from "../../src/data-model/DataModelDigestion";
import { EmitModes, Modes, RunOptions } from "../../src/OptionModel";
import { OdataTypes } from "../../src/data-model/edmx/ODataEdmxModel";
import { DataTypes, OperationTypes } from "../../src/data-model/DataTypeModel";

describe("Function Digestion Test", () => {
  const SERVICE_NAME = "FunctionTest";

  let odataBuilder: ODataModelBuilder;
  let runOpts: RunOptions;

  function doDigest() {
    return digest(odataBuilder.getSchema(), runOpts);
  }

  beforeEach(() => {
    odataBuilder = new ODataModelBuilder(ODataVersion.V4, SERVICE_NAME);
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
    odataBuilder.addFunction("GetBestFriend", OdataTypes.Boolean, false);

    const result = await doDigest();

    expect(result.getOperationTypeByBinding("xyz")).toEqual([]);
    expect(result.getOperationTypeByBinding("/")).toMatchObject([
      {
        odataName: "GetBestFriend",
        name: "getBestFriend",
        type: OperationTypes.Function,
        parameters: [],
        returnType: {
          dataType: DataTypes.PrimitiveType,
          name: "nO_NAME_BECAUSE_RETURN_TYPE",
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
    odataBuilder.addFunction("GetBestFriend", OdataTypes.String, false, (builder) => {
      builder
        .addParam("test", OdataTypes.String, false)
        .addParam("testTruth", OdataTypes.Boolean)
        .addParam("testNumber", OdataTypes.Decimal)
        .addParam("testDate", OdataTypes.Date);
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
            name: "testDate",
            type: "DateString",
          },
        ],
        returnType: {
          dataType: DataTypes.PrimitiveType,
          name: "nO_NAME_BECAUSE_RETURN_TYPE",
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

  test("Function: bound function returning string list", async () => {
    odataBuilder
      .addFunction("listAttitudes", "Collection(Edm.String)", true, (builder) => {
        builder.addParam("user", `${SERVICE_NAME}.User`);
      })
      .addFunction("testing", OdataTypes.String, true, (builder) => {
        builder.addParam("user", `${SERVICE_NAME}.User`);
      });

    const result = await doDigest();

    expect(result.getOperationTypeByBinding("User")).toMatchObject([
      {
        name: "listAttitudes",
        type: OperationTypes.Function,
        parameters: [],
        returnType: {
          isCollection: true,
          dataType: DataTypes.PrimitiveType,
          name: "nO_NAME_BECAUSE_RETURN_TYPE",
          odataName: "NO_NAME_BECAUSE_RETURN_TYPE",
          odataType: "Collection(Edm.String)",
          type: "string",
          qObject: "qStringCollection",
        },
      },
      {
        name: "testing",
        parameters: [],
      },
    ]);
  });

  test("Function: fail bound function without params", async () => {
    odataBuilder.addFunction("GetBestFriend", OdataTypes.Boolean, true);

    await expect(doDigest()).rejects.toThrowError("no parameters");
  });

  test("Function Import: min case", async () => {
    odataBuilder
      .addFunctionImport("GetBestFriend", "GetBestFriend", "Friends")
      .addFunction("GetBestFriend", OdataTypes.Boolean, false);
    // .addEntityType("User", undefined, (builder) => {
    //   builder.addKeyProp("id", OdataTypes.String);
    // });

    const result = await doDigest();
    expect(result.getEntityContainer().functions).toMatchObject({
      getBestFriend: { odataName: "GetBestFriend", name: "getBestFriend", entitySet: "Friends" },
    });
  });

  test("Function Import: fail without function", async () => {
    odataBuilder.addFunctionImport("GetBestFriend", "GetBestFriend", "Friends");

    await expect(doDigest()).rejects.toThrow("Couldn't find root operation with name [getBestFriend]");
  });
});
