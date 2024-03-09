import { ODataTypesV2 } from "@odata2ts/odata-core";
import deepmerge from "deepmerge";

import { digest } from "../../../src/data-model/DataModelDigestionV2";
import { DataTypes, OperationTypes } from "../../../src/data-model/DataTypeModel";
import { OperationType } from "../../../src/data-model/DataTypeModel";
import { NamingHelper } from "../../../src/data-model/NamingHelper";
import { DigestionOptions } from "../../../src/FactoryFunctionModel";
import { TypeModel } from "../../../src/TypeModel";
import { TestOptions, TestSettings } from "../../generator/TestTypes";
import { getTestConfig } from "../../test.config";
import { ODataModelBuilderV2 } from "../builder/v2/ODataModelBuilderV2";

describe("Function Digestion Test", () => {
  const NAMESPACE = "FunctionTest";
  const CONFIG = getTestConfig();

  let odataBuilder: ODataModelBuilderV2;
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
    odataBuilder = new ODataModelBuilderV2(NAMESPACE);
    digestionOptions = {};
  });

  test("Function: min case", async () => {
    const name = "GetBestFriend";
    const fqName = withEc(name);
    const expected: OperationType = {
      fqName,
      odataName: name,
      name: "getBestFriend",
      qName: "QGetBestFriend",
      paramsModelName: "GetBestFriendParams",
      type: OperationTypes.Function,
      parameters: [],
      returnType: undefined,
      usePost: false,
    };

    odataBuilder.addFunctionImport(name);

    const result = await doDigest();

    expect(result.getUnboundOperationType(fqName)).toStrictEqual(expected);
    expect(result.getUnboundOperationTypes()).toStrictEqual([expected]);
  });

  test("Function: with returnType", async () => {
    odataBuilder.addFunctionImport("getBestFriend", ODataTypesV2.Boolean);

    const result = await doDigest();

    expect(result.getUnboundOperationTypes()).toMatchObject([
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
      .addFunctionImport("listProducts", `Collection(${withNs("Product")})`)
      .addEntityType("Product", undefined, (builder) => {
        builder.addKeyProp("id", "Edm.Guid");
      });

    const result = await doDigest();

    expect(result.getUnboundOperationTypes()).toMatchObject([
      {
        name: "listProducts",
        type: OperationTypes.Function,
        parameters: [],
        returnType: {
          isCollection: true,
          dataType: DataTypes.ModelType,
          name: "noNameBecauseReturnType",
          odataName: "NO_NAME_BECAUSE_RETURN_TYPE",
          odataType: `Collection(${withNs("Product")})`,
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
        fqName: withEc("GetBestFriend"),
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

  test("renaming function imports", async () => {
    const funcName = "TestOp";
    const fqFuncName = withEc(funcName);
    const altFuncName = "ComplextestFunc";
    const fqAltFuncName = withEc(altFuncName);

    digestionOptions.byTypeAndName = [
      { type: TypeModel.OperationImportType, name: funcName, mappedName: "NewTestOperation" },
      { type: TypeModel.Any, name: new RegExp(withEc(`Complex(.+)`)), mappedName: "Cmplx_$1" },
    ];

    odataBuilder.addFunctionImport(funcName);
    odataBuilder.addFunctionImport(altFuncName);

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
      { type: TypeModel.Any, name: new RegExp(withEc(`Complex(.+)`)), mappedName: "Cmplx_$1" },
    ];

    odataBuilder.addFunctionImport(funcName);
    odataBuilder.addFunctionImport(altFuncName);

    const result = await doDigest();

    let toTest = result.getUnboundOperationType(withEc(funcName))!;
    expect(toTest.name).toBe("NewTestOperation");

    toTest = result.getUnboundOperationType(withEc(altFuncName))!;
    expect(toTest.name).toBe("Cmplx_testFunc");
  });
});
