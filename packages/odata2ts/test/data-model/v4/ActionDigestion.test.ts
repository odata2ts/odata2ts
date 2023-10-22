import { ODataTypesV4 } from "@odata2ts/odata-core";

import { digest } from "../../../src/data-model/DataModelDigestionV4";
import { DataTypes, OperationType, OperationTypes } from "../../../src/data-model/DataTypeModel";
import { NamingHelper } from "../../../src/data-model/NamingHelper";
import { getTestConfig } from "../../test.config";
import { ODataModelBuilderV4 } from "../builder/v4/ODataModelBuilderV4";

describe("Action Digestion Test", () => {
  const SERVICE_NAME = "ActionTest";
  const CONFIG = getTestConfig();
  const NAMING_HELPER = new NamingHelper(CONFIG, SERVICE_NAME);

  let odataBuilder: ODataModelBuilderV4;

  function withNs(name: string) {
    return `${SERVICE_NAME}.${name}`;
  }

  function doDigest() {
    return digest(odataBuilder.getSchemas(), CONFIG, NAMING_HELPER);
  }

  beforeEach(() => {
    odataBuilder = new ODataModelBuilderV4(SERVICE_NAME);
  });

  test("Action: min case", async () => {
    const opName = "AddFriend";
    const expected: OperationType = {
      fqName: withNs(opName),
      odataName: opName,
      name: "addFriend",
      qName: "QAddFriend",
      paramsModelName: "AddFriendParams",
      type: OperationTypes.Action,
      parameters: [],
      returnType: undefined,
    };

    odataBuilder.addAction(opName);
    const result = await doDigest();

    expect(result.getOperationType(withNs(opName))).toStrictEqual(expected);
    expect(result.getUnboundOperationTypes()).toStrictEqual([expected]);
  });

  test("Action: with params", async () => {
    const opName = "addFriend";
    odataBuilder.addAction(opName, ODataTypesV4.String, false, (builder) => {
      builder
        .addParam("test", ODataTypesV4.String, false)
        .addParam("testTruth", ODataTypesV4.Boolean)
        .addParam("testNumber", ODataTypesV4.Decimal)
        .addParam("testDate", ODataTypesV4.Date);
    });

    const result = await doDigest();

    expect(result.getUnboundOperationTypes()).toMatchObject([
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
      .addAction("searchWithFilter", `Collection(${withNs("User")})`, true, (builder) => {
        builder.addParam("user", withNs("User")).addParam("choice", withNs("Choice"));
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

    expect(result.getEntityTypeOperations(withNs("User"))).toMatchObject([
      {
        name: "searchWithFilter",
        type: OperationTypes.Action,
        parameters: [
          {
            name: "choice",
            dataType: DataTypes.EnumType,
            odataType: withNs("Choice"),
            type: "Choice",
            qObject: undefined,
          },
        ],
        returnType: {
          isCollection: true,
          dataType: DataTypes.ModelType,
          name: "noNameBecauseReturnType",
          odataName: "NO_NAME_BECAUSE_RETURN_TYPE",
          odataType: `Collection(${withNs("User")})`,
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
      .addActionImport("NotifyBestFriend", withNs("messageBestFriend"))
      .addAction("messageBestFriend", undefined, false);

    const result = await doDigest();
    expect(result.getEntityContainer().actions).toMatchObject({
      [withNs("notifyBestFriend")]: { odataName: "NotifyBestFriend", name: "notifyBestFriend" },
    });
  });
});
