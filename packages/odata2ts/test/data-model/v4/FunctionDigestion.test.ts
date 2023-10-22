import { ODataTypesV4 } from "@odata2ts/odata-core";

import { digest } from "../../../src/data-model/DataModelDigestionV4";
import { DataTypes, OperationTypes } from "../../../src/data-model/DataTypeModel";
import { NamingHelper } from "../../../src/data-model/NamingHelper";
import { getTestConfig } from "../../test.config";
import { ODataModelBuilderV4 } from "../builder/v4/ODataModelBuilderV4";

describe("Function Digestion Test", () => {
  const SERVICE_NAME = "FunctionTest";
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

  test("Function: min case", async () => {
    odataBuilder.addFunction("GetBestFriend", ODataTypesV4.Boolean, false);

    const result = await doDigest();

    expect(result.getEntityTypeOperations("xyz")).toEqual([]);
    expect(result.getUnboundOperationTypes()).toMatchObject([
      {
        odataName: "GetBestFriend",
        name: "getBestFriend",
        qName: "QGetBestFriend",
        paramsModelName: "GetBestFriendParams",
        type: OperationTypes.Function,
        parameters: [],
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
    odataBuilder.addFunction("GetBestFriend", ODataTypesV4.String, false, (builder) => {
      builder
        .addParam("test", ODataTypesV4.String, false)
        .addParam("testTruth", ODataTypesV4.Boolean)
        .addParam("testNumber", ODataTypesV4.Decimal)
        .addParam("testDate", ODataTypesV4.Date);
    });

    const result = await doDigest();

    expect(result.getUnboundOperationTypes()).toMatchObject([
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

  test("Function: with complex and enum params", async () => {
    odataBuilder
      .addComplexType("Complex", undefined, (builder) => builder.addProp("a", ODataTypesV4.String))
      .addEntityType("TheEntity", undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.String))
      .addEnumType("TheEnum", [{ name: "One", value: 1 }])
      .addFunction("test", ODataTypesV4.String, false, (builder) => {
        return builder
          .addParam("complex", withNs("Complex"))
          .addParam("entity", withNs("TheEntity"))
          .addParam("enum", withNs("TheEnum"));
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

  test("Function: bound function returning string list", async () => {
    odataBuilder
      .addEntityType("User", undefined, (builder) => {
        builder.addKeyProp("id", ODataTypesV4.String);
      })
      .addFunction("listAttitudes", "Collection(Edm.String)", true, (builder) => {
        builder.addParam("user", withNs("User"));
      })
      .addFunction("testing", ODataTypesV4.String, true, (builder) => {
        builder.addParam("user", withNs("User"));
      });

    const result = await doDigest();

    expect(result.getEntityTypeOperations(withNs("User"))).toMatchObject([
      {
        fqName: withNs("listAttitudes"),
        name: "listAttitudes",
        qName: "User_QListAttitudes",
        paramsModelName: "User_ListAttitudesParams",
        type: OperationTypes.Function,
        parameters: [],
        returnType: {
          isCollection: true,
          dataType: DataTypes.PrimitiveType,
          name: "noNameBecauseReturnType",
          odataName: "NO_NAME_BECAUSE_RETURN_TYPE",
          odataType: "Collection(Edm.String)",
          type: "string",
          qObject: "QStringCollection",
        },
      },
      {
        name: "testing",
        parameters: [],
      },
    ]);
  });

  test("Function: fail bound function without params", async () => {
    odataBuilder.addFunction("GetBestFriend", ODataTypesV4.Boolean, true);

    await expect(doDigest()).rejects.toThrowError("no parameters");
  });

  test("Function Import: min case", async () => {
    odataBuilder
      .addFunctionImport("GetBestFriend", withNs("GetBestFriend"), "Friends")
      .addFunction("GetBestFriend", ODataTypesV4.Boolean, false);
    // .addEntityType("User", undefined, (builder) => {
    //   builder.addKeyProp("id", OdataTypes.String);
    // });

    const result = await doDigest();
    expect(result.getEntityContainer().functions).toMatchObject({
      [withNs("getBestFriend")]: { odataName: "GetBestFriend", name: "getBestFriend", entitySet: "Friends" },
    });
  });
});
