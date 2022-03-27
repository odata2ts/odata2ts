import { ODataModelBuilder, ODataVersion } from "./builder/ODataModelBuilder";
import { digest } from "../../src/data-model/DataModelDigestion";
import { EmitModes, Modes, RunOptions } from "../../src/OptionModel";
import { OdataTypes } from "../../src/data-model/edmx/ODataEdmxModel";
import { DataTypes, OperationTypes } from "../../src/data-model/DataTypeModel";

describe("Action Digestion Test", () => {
  const SERVICE_NAME = "ActionTest";

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

  test("Action: min case", async () => {
    odataBuilder.addAction("AddFriend");

    const result = await doDigest();

    expect(result.getOperationTypeByBinding("xyz")).toEqual([]);
    expect(result.getOperationTypeByBinding("/")).toMatchObject([
      {
        odataName: "AddFriend",
        name: "addFriend",
        type: OperationTypes.Action,
        parameters: [],
        returnType: undefined,
      },
    ]);
  });

  test("Action: with params", async () => {
    odataBuilder.addAction("addFriend", OdataTypes.String, false, (builder) => {
      builder
        .addParam("test", OdataTypes.String, false)
        .addParam("testTruth", OdataTypes.Boolean)
        .addParam("testNumber", OdataTypes.Decimal)
        .addParam("testDate", OdataTypes.Date);
    });

    const result = await doDigest();

    expect(result.getOperationTypeByBinding("/")).toMatchObject([
      {
        name: "addFriend",
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

  test("Action: bound action returning entity list", async () => {
    odataBuilder
      .addAction("searchWithFilter", `Collection(${SERVICE_NAME}.User)`, true, (builder) => {
        builder.addParam("user", `${SERVICE_NAME}.User`).addParam("choice", `${SERVICE_NAME}.Choice`);
      })
      .addEnumType("Choice", [
        { name: "A", value: 1 },
        { name: "B", value: 9 },
        { name: "C", value: 4 },
      ]);

    const result = await doDigest();

    expect(result.getOperationTypeByBinding("User")).toMatchObject([
      {
        name: "searchWithFilter",
        type: OperationTypes.Action,
        parameters: [
          {
            name: "choice",
            dataType: DataTypes.EnumType,
            odataType: `${SERVICE_NAME}.Choice`,
            type: "Choice",
            qObject: undefined,
          },
        ],
        returnType: {
          isCollection: true,
          dataType: DataTypes.ModelType,
          name: "nO_NAME_BECAUSE_RETURN_TYPE",
          odataName: "NO_NAME_BECAUSE_RETURN_TYPE",
          odataType: `Collection(${SERVICE_NAME}.User)`,
          type: "User",
          qObject: "qUser",
        },
      },
    ]);
  });

  test("Action: fail bound function without params", async () => {
    odataBuilder.addAction("NotifyBestFriend", OdataTypes.Boolean, true);

    await expect(doDigest()).rejects.toThrowError("no parameters");
  });

  test("Actino Import: min case", async () => {
    odataBuilder
      .addActionImport("NotifyBestFriend", "messageBestFriend")
      .addAction("messageBestFriend", undefined, false);
    // .addEntityType("User", undefined, (builder) => {
    //   builder.addKeyProp("id", OdataTypes.String);
    // });

    const result = await doDigest();
    expect(result.getEntityContainer().actions).toMatchObject({
      notifyBestFriend: { odataName: "NotifyBestFriend", name: "notifyBestFriend" },
    });
  });
});
