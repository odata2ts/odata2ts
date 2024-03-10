import { ODataTypesV4 } from "@odata2ts/odata-core";
import deepmerge from "deepmerge";

import { digest } from "../../../src/data-model/DataModelDigestionV4";
import { DataTypes, OperationTypes } from "../../../src/data-model/DataTypeModel";
import { NamingHelper } from "../../../src/data-model/NamingHelper";
import { DigestionOptions } from "../../../src/FactoryFunctionModel";
import { TypeModel } from "../../../src/TypeModel";
import { TestOptions, TestSettings } from "../../generator/TestTypes";
import { getTestConfig } from "../../test.config";
import { ODataModelBuilderV4 } from "../builder/v4/ODataModelBuilderV4";

describe("Function Digestion Test", () => {
  const NAMESPACE = "FunctionTest";
  const CONFIG = getTestConfig();

  let odataBuilder: ODataModelBuilderV4;
  let digestionOptions: Partial<DigestionOptions> & Pick<TestOptions, "naming" | "allowRenaming">;

  function withNs(name: string) {
    return `${NAMESPACE}.${name}`;
  }

  function withEc(name: string) {
    return `ENTITY_CONTAINER.${name}`;
  }

  function doDigest() {
    const opts = digestionOptions ? (deepmerge(CONFIG, digestionOptions) as TestSettings) : CONFIG;
    return digest(odataBuilder.getSchemas(), opts, new NamingHelper(opts, NAMESPACE));
  }

  beforeEach(() => {
    odataBuilder = new ODataModelBuilderV4(NAMESPACE);
    digestionOptions = {};
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
    const name = "GetBestFriend";
    odataBuilder.addFunctionImport(name, withEc(name), "Friends").addFunction(name, ODataTypesV4.Boolean, false);
    // .addEntityType("User", undefined, (builder) => {
    //   builder.addKeyProp("id", OdataTypes.String);
    // });

    const result = await doDigest();
    expect(result.getEntityContainer().functions).toMatchObject({
      [withNs(name)]: { odataName: "GetBestFriend", name: "getBestFriend", entitySet: "Friends" },
    });
  });

  test("Function Import: renaming", async () => {
    const importName = "getBestFriend";
    const importNameNew = "newFuncImportName";
    const funcName = "getBestFriendFunc";
    const importName2 = "getWhatever";
    const importName2New = "evergreen";
    const funcName2 = "getWhateverFunc";
    odataBuilder
      .addFunctionImport(importName, withNs(funcName), "Friends")
      .addFunction(funcName, ODataTypesV4.Boolean, false)
      .addFunctionImport(importName2, withNs(funcName2), "Friends")
      .addFunction(funcName2, ODataTypesV4.Boolean, false);

    digestionOptions.byTypeAndName = [
      { type: TypeModel.OperationImportType, name: importName, mappedName: importNameNew },
      { type: TypeModel.Any, name: new RegExp(withEc(`getWhat(.+)`)), mappedName: "$1green" },
    ];

    const result = await doDigest();
    expect(result.getEntityContainer().functions).toStrictEqual({
      [withEc(importName)]: {
        odataName: importName,
        fqName: withEc(importName),
        name: importNameNew,
        entitySet: "Friends",
        operation: withNs(funcName),
      },
      [withEc(importName2)]: {
        odataName: importName2,
        fqName: withEc(importName2),
        name: importName2New,
        entitySet: "Friends",
        operation: withNs(funcName2),
      },
    });
  });

  test("renaming functions", async () => {
    const funcName = "TestOp";
    const fqFuncName = withNs(funcName);
    const altFuncName = "ComplextestFunc";
    const fqAltFuncName = withNs(altFuncName);

    digestionOptions.byTypeAndName = [
      { type: TypeModel.OperationType, name: funcName, mappedName: "NewTestOperation" },
      { type: TypeModel.Any, name: new RegExp(`${NAMESPACE}\.Complex(.+)`), mappedName: "Cmplx_$1" },
    ];

    odataBuilder.addFunction(funcName, ODataTypesV4.Boolean, false);
    odataBuilder.addFunction(altFuncName, ODataTypesV4.Boolean, false);

    const result = await doDigest();

    let toTest = result.getUnboundOperationType(fqFuncName)!;
    expect(toTest).toBeDefined();
    expect(toTest.odataName).toBe(funcName);
    expect(toTest.fqName).toBe(fqFuncName);
    expect(toTest.name).toBe("newTestOperation");

    toTest = result.getUnboundOperationType(fqAltFuncName)!;
    expect(toTest).toBeDefined();
    expect(toTest.odataName).toBe(altFuncName);
    expect(toTest.fqName).toBe(fqAltFuncName);
    expect(toTest.name).toBe("cmplxTestFunc");
  });

  test("renaming functions without changing case", async () => {
    const funcName = "TestOp";
    const altFuncName = "ComplextestFunc";

    digestionOptions.allowRenaming = false;
    digestionOptions.byTypeAndName = [
      { type: TypeModel.Any, name: funcName, mappedName: "NewTestOperation" },
      { type: TypeModel.Any, name: new RegExp(`${NAMESPACE}\.Complex(.+)`), mappedName: "Cmplx_$1" },
    ];

    odataBuilder.addFunction(funcName, ODataTypesV4.Boolean, false);
    odataBuilder.addFunction(altFuncName, ODataTypesV4.Boolean, false);

    const result = await doDigest();

    let toTest = result.getUnboundOperationType(withNs(funcName))!;
    expect(toTest.name).toBe("NewTestOperation");

    toTest = result.getUnboundOperationType(withNs(altFuncName))!;
    expect(toTest.name).toBe("Cmplx_testFunc");
  });
});
