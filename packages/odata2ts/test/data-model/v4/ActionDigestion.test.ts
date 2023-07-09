import { ODataTypesV4 } from "@odata2ts/odata-core";

import { digest } from "../../../src/data-model/DataModelDigestionV4";
import { DataTypes, OperationTypes } from "../../../src/data-model/DataTypeModel";
import { NamingHelper } from "../../../src/data-model/NamingHelper";
import { getTestConfig } from "../../test.config";
import { ODataModelBuilderV4 } from "../builder/v4/ODataModelBuilderV4";

describe("Action Digestion Test", () => {
  const SERVICE_NAME = "ActionTest";
  const CONFIG = getTestConfig();
  const NAMING_HELPER = new NamingHelper(CONFIG, SERVICE_NAME);

  let odataBuilder: ODataModelBuilderV4;

  function doDigest() {
    return digest(odataBuilder.getSchemas(), CONFIG, NAMING_HELPER);
  }

  beforeEach(() => {
    odataBuilder = new ODataModelBuilderV4(SERVICE_NAME);
  });

  test("Action: min case", async () => {
    odataBuilder.addAction("AddFriend");

    const result = await doDigest();

    expect(result.getOperationTypeByBinding("xyz")).toEqual([]);
    expect(result.getOperationTypeByBinding("/")).toMatchObject([
      {
        odataName: "AddFriend",
        name: "addFriend",
        qName: "QAddFriend",
        paramsModelName: "AddFriendParams",
        type: OperationTypes.Action,
        parameters: [],
        returnType: undefined,
      },
    ]);
  });

  test("Action: with params", async () => {
    odataBuilder.addAction("addFriend", ODataTypesV4.String, false, (builder) => {
      builder
        .addParam("test", ODataTypesV4.String, false)
        .addParam("testTruth", ODataTypesV4.Boolean)
        .addParam("testNumber", ODataTypesV4.Decimal)
        .addParam("testDate", ODataTypesV4.Date);
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

  test("Action: bound action returning entity list", async () => {
    odataBuilder
      .addAction("searchWithFilter", `Collection(${SERVICE_NAME}.User)`, true, (builder) => {
        builder.addParam("user", `${SERVICE_NAME}.User`).addParam("choice", `${SERVICE_NAME}.Choice`);
      })
      .addEntityType("User", undefined, (builder) => {
        builder.addKeyProp("id", ODataTypesV4.String);
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
          name: "noNameBecauseReturnType",
          odataName: "NO_NAME_BECAUSE_RETURN_TYPE",
          odataType: `Collection(${SERVICE_NAME}.User)`,
          type: "User",
          qObject: "QUser",
        },
      },
    ]);
  });

  test("Action: fail bound function without params", async () => {
    odataBuilder.addAction("NotifyBestFriend", ODataTypesV4.Boolean, true);

    await expect(doDigest()).rejects.toThrowError("no parameters");
  });

  test("Action Import: min case", async () => {
    odataBuilder
      .addEntityType("User", undefined, (builder) => {
        builder.addKeyProp("id", ODataTypesV4.String);
      })
      .addActionImport("NotifyBestFriend", "messageBestFriend")
      .addAction("messageBestFriend", undefined, false);

    const result = await doDigest();
    expect(result.getEntityContainer().actions).toMatchObject({
      notifyBestFriend: { odataName: "NotifyBestFriend", name: "notifyBestFriend" },
    });
  });
});
