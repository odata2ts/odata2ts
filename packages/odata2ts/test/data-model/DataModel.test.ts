import { MappedConverterChains } from "@odata2ts/converter-runtime";
import { ODataTypesV2, ODataTypesV4 } from "@odata2ts/odata-core";

import { DataModel, NamespaceWithAlias } from "../../src/data-model/DataModel";
import { DataTypes, ODataVersion } from "../../src/data-model/DataTypeModel";

describe("Data Model Tests", function () {
  let dataModel: DataModel;

  const NS1 = "Test";
  const NS2 = "Test.2";
  const ALIAS_NS2 = "_Self";
  const NAMESPACES: Array<NamespaceWithAlias> = [[NS1], [NS2, ALIAS_NS2]];

  beforeEach(() => {
    dataModel = new DataModel(NAMESPACES, ODataVersion.V4);
  });

  test("smoke test", () => {
    expect(dataModel.getODataVersion()).toBe(ODataVersion.V4);
    expect(dataModel.isV4()).toBe(true);
    expect(dataModel.isV2()).toBe(false);

    expect(dataModel.getEntityTypes().length).toBe(0);
    expect(dataModel.getComplexTypes().length).toBe(0);
    expect(dataModel.getEnums().length).toBe(0);
  });

  test("v2 version", () => {
    const result = new DataModel(NAMESPACES, ODataVersion.V2);

    expect(result.getODataVersion()).toBe(ODataVersion.V2);
    expect(result.isV2()).toBe(true);
    expect(result.isV4()).toBe(false);
  });

  test("adding converter", () => {
    const pkg = "test";
    const converterId = "testId";
    const expected = {
      from: ODataTypesV2.Time,
      to: ODataTypesV4.Duration,
      converters: [{ package: pkg, converterId }],
    };

    const convMap: MappedConverterChains = new Map();
    convMap.set(ODataTypesV2.Time, expected);

    dataModel = new DataModel(NAMESPACES, ODataVersion.V4, convMap);

    expect(dataModel.getConverter(ODataTypesV2.Time)).toStrictEqual(expected);
  });

  test("primitive type definition", () => {
    const modelName = "Xxx";
    const fqName = `${NS1}.${modelName}`;
    const type = "Edm.String";

    dataModel.addTypeDefinition(NS1, modelName, type);

    expect(dataModel.getPrimitiveType(fqName)).toBe(type);
  });

  test("primitive type definition by alias", () => {
    const modelName = "Xxx";
    const aliasName = `${ALIAS_NS2}.${modelName}`;
    const type = "Edm.String";

    dataModel.addTypeDefinition(NS2, modelName, type);

    expect(dataModel.getPrimitiveType(aliasName)).toBe(type);
  });

  test("add & get model", () => {
    const modelName = "Xxx";
    const fqName = `${NS1}.${modelName}`;
    const dummy = { name: modelName, fqName, baseClasses: [] };
    const expectedDummy = { ...dummy, dataType: DataTypes.ModelType };

    dataModel.addEntityType(
      NS1,
      modelName,
      // @ts-expect-error
      dummy
    );

    expect(dataModel.getEntityType(fqName)).toStrictEqual(expectedDummy);
    expect(dataModel.getEntityType("xyz")).toBeUndefined();
    expect(dataModel.getEntityTypes()).toStrictEqual([expectedDummy]);
  });

  test("get model by alias", () => {
    const modelName = "Xxx";
    const aliasName = `${ALIAS_NS2}.${modelName}`;
    const dummy = { x: "y", name: modelName };
    const expectedDummy = { ...dummy, dataType: DataTypes.ModelType };

    dataModel.addEntityType(
      NS2,
      modelName,
      // @ts-expect-error
      dummy
    );

    expect(dataModel.getEntityType(aliasName)).toStrictEqual(expectedDummy);
  });

  test("add & get complex type", () => {
    const modelName = "Xxx";
    const fqName = `${NS1}.${modelName}`;
    const dummy = { name: modelName, fqName, baseClasses: [] };
    const expectedDummy = { ...dummy, dataType: DataTypes.ComplexType };

    dataModel.addComplexType(
      NS1,
      modelName,
      // @ts-expect-error
      dummy
    );

    expect(dataModel.getComplexType(fqName)).toStrictEqual(expectedDummy);
    expect(dataModel.getComplexType("xyz")).toBeUndefined();
    expect(dataModel.getComplexTypes()).toStrictEqual([expectedDummy]);
  });

  test("get complex type by alias", () => {
    const modelName = "Xxx";
    const aliasName = `${ALIAS_NS2}.${modelName}`;
    const dummy = { x: "y", name: modelName };
    dataModel.addComplexType(
      NS2,
      modelName,
      // @ts-expect-error
      dummy
    );

    expect(dataModel.getComplexType(aliasName)).toMatchObject(dummy);
  });

  test("add & get enum", () => {
    const modelName = "Xxx";
    const dummy = { x: "y", name: modelName };
    const expectedDummy = { ...dummy, dataType: DataTypes.EnumType };
    dataModel.addEnum(
      NS1,
      modelName,
      // @ts-expect-error
      dummy
    );

    expect(dataModel.getEnums()).toStrictEqual([expectedDummy]);
  });

  test("unbound operation", () => {
    const opName = "Xxx";
    const fqName = `${NS1}.${opName}`;
    const dummyOp = { fqName, odataName: opName };

    dataModel.addUnboundOperationType(
      NS1,
      // @ts-expect-error
      dummyOp
    );

    expect(dataModel.getUnboundOperationTypes()).toStrictEqual([dummyOp]);
    expect(dataModel.getUnboundOperationType(fqName)).toStrictEqual(dummyOp);
  });

  test("unbound operation by alias", () => {
    const opName = "Xxx";
    const aliasName = `${ALIAS_NS2}.${opName}`;
    const dummyOp = { fqName: `${NS2}.${opName}`, odataName: opName };
    dataModel.addUnboundOperationType(
      NS2,
      // @ts-expect-error
      dummyOp
    );

    expect(dataModel.getUnboundOperationType(aliasName)).toStrictEqual(dummyOp);
  });

  test("operation bound to entity", () => {
    const opName = "Xxx";
    const fqName = `${NS1}.${opName}`;
    const dummyOp = { fqName, odataName: opName };

    const bindingEntity = "xyz.abc";
    const dummyBinding = { fqType: bindingEntity, isCollection: false };

    dataModel.addBoundOperationType(
      NS1,
      // @ts-expect-error
      dummyBinding,
      dummyOp
    );

    expect(dataModel.getEntityTypeOperations(bindingEntity)).toStrictEqual([dummyOp]);
    expect(dataModel.getEntitySetOperations(bindingEntity)).toStrictEqual([]);
    expect(dataModel.getUnboundOperationTypes()).toStrictEqual([]);
  });

  test("operation bound to entity collection", () => {
    const opName = "Xxx";
    const fqName = `${NS1}.${opName}`;
    const dummyOp = { fqName, odataName: opName };

    const bindingEntity = "xyz.abc";
    const dummyBinding = { fqType: bindingEntity, isCollection: true };

    dataModel.addBoundOperationType(
      NS1,
      // @ts-expect-error
      dummyBinding,
      dummyOp
    );

    expect(dataModel.getEntityTypeOperations(bindingEntity)).toStrictEqual([]);
    expect(dataModel.getEntitySetOperations(bindingEntity)).toStrictEqual([dummyOp]);
  });

  test("bound operation by alias", () => {
    const opName = "Xxx";
    const dummyOp = { fqName: `${NS2}.${opName}`, odataName: opName };

    const entityName = "abc";
    const bindingEntity = `${NS2}.${entityName}`;
    const aliasName = `${ALIAS_NS2}.${entityName}`;

    dataModel.addEntityType(
      NS2,
      entityName,
      // @ts-expect-error,
      {}
    );
    dataModel.addBoundOperationType(
      NS2,
      // @ts-expect-error,
      { fqType: bindingEntity, isCollection: false },
      dummyOp
    );
    dataModel.addBoundOperationType(
      NS2,
      // @ts-expect-error,
      { fqType: bindingEntity, isCollection: true },
      dummyOp
    );

    expect(dataModel.getEntityTypeOperations(aliasName)).toStrictEqual([dummyOp]);
    expect(dataModel.getEntitySetOperations(aliasName)).toStrictEqual([dummyOp]);
  });

  test("add action", () => {
    const name = "XyZ";
    const fqName = `${NS1}.${name}`;
    const dummy = { x: "y", name };
    dataModel.addAction(
      fqName,
      // @ts-expect-error
      dummy
    );

    expect(dataModel.getEntityContainer()).toStrictEqual({
      entitySets: {},
      singletons: {},
      functions: {},
      actions: { [fqName]: dummy },
    });
  });

  test("add function", () => {
    const name = "XyZ";
    const fqName = `${NS1}.${name}`;
    const dummy = { x: "y", name };
    dataModel.addFunction(
      fqName,
      // @ts-expect-error
      dummy
    );

    expect(dataModel.getEntityContainer()).toStrictEqual({
      entitySets: {},
      singletons: {},
      functions: { [fqName]: dummy },
      actions: {},
    });
  });

  test("add entitySet", () => {
    const name = "XyZ";
    const fqName = `${NS1}.${name}`;
    const dummy = { x: "y" };
    dataModel.addEntitySet(
      fqName,
      // @ts-expect-error
      dummy
    );

    expect(dataModel.getEntityContainer()).toStrictEqual({
      entitySets: { [fqName]: dummy },
      singletons: {},
      functions: {},
      actions: {},
    });
  });

  test("add singleton", () => {
    const name = "XyZ";
    const fqName = `${NS1}.${name}`;
    const dummy = { x: "y" };
    dataModel.addSingleton(
      fqName,
      // @ts-expect-error
      dummy
    );

    expect(dataModel.getEntityContainer()).toStrictEqual({
      entitySets: {},
      singletons: { [fqName]: dummy },
      functions: {},
      actions: {},
    });
  });

  test("add model with empty namespace", () => {
    const modelName = "Xxx";
    const dummy = { name: modelName, baseClasses: [] };
    const expectedDummy = { ...dummy, dataType: DataTypes.ModelType };

    dataModel.addEntityType(
      "",
      modelName,
      // @ts-expect-error
      dummy
    );

    expect(dataModel.getEntityType(modelName)).toStrictEqual(expectedDummy);
  });
});
