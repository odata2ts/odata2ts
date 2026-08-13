import { ODataTypesV4 } from "@odata2ts/odata-core";
import deepmerge from "deepmerge";
import { beforeEach, expect, test } from "vitest";
import { DataModel } from "../../src/data-model/DataModel.js";
import { DataTypes, EnumType } from "../../src/data-model/DataTypeModel.js";
import { NamingHelper } from "../../src/data-model/NamingHelper.js";
import { DigesterFunction, DigestionOptions } from "../../src/FactoryFunctionModel.js";
import { TestSettings } from "../generator/TestTypes.js";
import { getTestConfig } from "../test.config.js";
import { AllowedValue, allowedValues, core } from "./builder/ODataAnnotationBuilder.js";
import { ODataModelBuilder } from "./builder/ODataModelBuilder.js";
import { ModelBuilderConstructor } from "./DataModelDigestionTests.js";

/**
 * Deriving an enum from `Validation.AllowedValues`, which is how SAP CAP states one: a CDS enum is a
 * constraint on a value rather than a type of its own, so no `<EnumType>` is emitted and the property
 * keeps its primitive type.
 *
 * Both OData versions run these, since the V2 rendition CAP serves carries the very same annotations.
 */
export function createAllowedValuesEnumTests(
  ODataBuilderConstructor: ModelBuilderConstructor<any>,
  digest: DigesterFunction<any>,
) {
  const SERVICE_NAME = "Tester";
  const ENTITY_NAME = "Copy";
  const TEST_CONFIG = getTestConfig();

  const STATUS_VALUES: Array<AllowedValue> = [
    { name: "Available", value: 0 },
    { name: "OnLoan", value: 1 },
    { name: "InRepair", value: 2 },
  ];

  let odataBuilder: ODataModelBuilder<any, any, any, any>;
  let digestionOptions: Partial<DigestionOptions>;

  function withNs(name: string) {
    return `${SERVICE_NAME}.${name}`;
  }

  async function doDigest() {
    const opts = deepmerge(TEST_CONFIG, digestionOptions) as TestSettings;
    return await digest(
      odataBuilder.getSchemas(),
      opts,
      new NamingHelper(opts, SERVICE_NAME),
      odataBuilder.getReferences(),
    );
  }

  function propOf(result: DataModel, propName: string, entityName: string = ENTITY_NAME) {
    const model = result.getEntityType(withNs(entityName))!;
    const prop = [...model.baseProps, ...model.props].find((p) => p.odataName === propName);
    expect(prop, `property [${propName}] not found!`).toBeTruthy();
    return prop!;
  }

  /**
   * An entity with one annotated property, stated externally the way CAP does.
   */
  function buildModel(values: Array<AllowedValue>, type: string = ODataTypesV4.Byte, propName: string = "Status") {
    odataBuilder
      .enableAnnotations()
      .addEntityType(ENTITY_NAME, undefined, (builder: any) =>
        builder.addKeyProp("Id", ODataTypesV4.Guid).addProp(propName, type, true),
      )
      .addExternalAnnotations(`${withNs(ENTITY_NAME)}/${propName}`, [allowedValues(values)]);
  }

  beforeEach(() => {
    odataBuilder = new ODataBuilderConstructor(SERVICE_NAME);
    digestionOptions = { enumByAllowedValues: true };
  });

  /**
   * The property was left as the primitive it was declared as. Which TypeScript type that is differs
   * between the versions - V2 hands over some numeric types as strings - so only the kind is asserted.
   */
  function expectUntouched(result: DataModel, propName: string = "Status") {
    expect(result.getEnums().length).toBe(0);
    expect(propOf(result, propName).dataType).toBe(DataTypes.PrimitiveType);
  }

  test("off by default: the property stays the primitive it is", async () => {
    digestionOptions = {};
    buildModel(STATUS_VALUES);

    expectUntouched(await doDigest());
  });

  test("the property is typed with the derived enum", async () => {
    buildModel(STATUS_VALUES);

    const result = await doDigest();
    const prop = propOf(result, "Status");

    expect(prop.dataType).toBe(DataTypes.EnumType);
    expect(prop.type).toBe("Status");
    expect(prop.fqType).toBe(withNs("Status"));
    expect(prop.qPath).toBe("QEnumPath");
    expect(prop.qParam).toBe("QEnumParam");
  });

  test("the enum is named after the property and knows its wire type", async () => {
    buildModel(STATUS_VALUES);

    const enums = (await doDigest()).getEnums();
    expect(enums.length).toBe(1);
    expect(enums[0]).toMatchObject({
      name: "Status",
      modelName: "Status",
      fqName: withNs("Status"),
      wireType: ODataTypesV4.Byte,
      members: [
        { name: "Available", value: 0 },
        { name: "OnLoan", value: 1 },
        { name: "InRepair", value: 2 },
      ],
    } satisfies Partial<EnumType>);
  });

  test("string values are taken as they are", async () => {
    buildModel(
      [
        { name: "Hardcover", value: "HC" },
        { name: "Paperback", value: "PB" },
      ],
      ODataTypesV4.String,
    );

    const enums = (await doDigest()).getEnums();
    expect(enums[0].wireType).toBe(ODataTypesV4.String);
    expect(enums[0].members).toStrictEqual([
      { name: "Hardcover", value: "HC" },
      { name: "Paperback", value: "PB" },
    ]);
  });

  test("a collection valued property keeps its collection", async () => {
    buildModel(STATUS_VALUES, `Collection(${ODataTypesV4.Byte})`);

    const prop = propOf(await doDigest(), "Status");
    expect(prop.isCollection).toBe(true);
    expect(prop.dataType).toBe(DataTypes.EnumType);
    expect(prop.qPath).toBe("QEnumCollectionPath");
  });

  test("the same members on two properties give one enum", async () => {
    odataBuilder
      .enableAnnotations()
      .addEntityType(ENTITY_NAME, undefined, (builder: any) =>
        builder.addKeyProp("Id", ODataTypesV4.Guid).addProp("Status", ODataTypesV4.Byte, true),
      )
      .addEntityType("Loan", undefined, (builder: any) =>
        builder.addKeyProp("Id", ODataTypesV4.Guid).addProp("Status", ODataTypesV4.Byte, true),
      )
      .addExternalAnnotations(`${withNs(ENTITY_NAME)}/Status`, [allowedValues(STATUS_VALUES)])
      .addExternalAnnotations(`${withNs("Loan")}/Status`, [allowedValues(STATUS_VALUES)]);

    const result = await doDigest();
    expect(result.getEnums().length).toBe(1);
    expect(propOf(result, "Status").fqType).toBe(withNs("Status"));
    expect(propOf(result, "Status", "Loan").fqType).toBe(withNs("Status"));
  });

  test("differing members under one name are told apart", async () => {
    odataBuilder
      .enableAnnotations()
      .addEntityType(ENTITY_NAME, undefined, (builder: any) =>
        builder.addKeyProp("Id", ODataTypesV4.Guid).addProp("Status", ODataTypesV4.Byte, true),
      )
      .addEntityType("Loan", undefined, (builder: any) =>
        builder.addKeyProp("Id", ODataTypesV4.Guid).addProp("Status", ODataTypesV4.Byte, true),
      )
      .addExternalAnnotations(`${withNs(ENTITY_NAME)}/Status`, [allowedValues(STATUS_VALUES)])
      .addExternalAnnotations(`${withNs("Loan")}/Status`, [
        allowedValues([
          { name: "Open", value: 0 },
          { name: "Closed", value: 1 },
        ]),
      ]);

    const result = await doDigest();
    expect(result.getEnums().map((et) => et.name)).toStrictEqual(["Status", "Status2"]);
    expect(propOf(result, "Status").fqType).toBe(withNs("Status"));
    expect(propOf(result, "Status", "Loan").fqType).toBe(withNs("Status2"));
  });

  test("a name a declared type already holds is given way to", async () => {
    odataBuilder
      .enableAnnotations()
      .addEnumType("Status", [{ name: "Whatever", value: 0 }])
      .addEntityType(ENTITY_NAME, undefined, (builder: any) =>
        builder.addKeyProp("Id", ODataTypesV4.Guid).addProp("Status", ODataTypesV4.Byte, true),
      )
      .addExternalAnnotations(`${withNs(ENTITY_NAME)}/Status`, [allowedValues(STATUS_VALUES)]);

    const result = await doDigest();
    expect(propOf(result, "Status").fqType).toBe(withNs("Status2"));
  });

  test("one value without a symbolic name leaves the property alone", async () => {
    buildModel([...STATUS_VALUES, { value: 3 }]);

    expectUntouched(await doDigest());
  });

  test("no symbolic name at all leaves the property alone", async () => {
    buildModel([{ value: 0 }, { value: 1 }]);

    expectUntouched(await doDigest());
  });

  test("a qualified annotation is none of our business", async () => {
    odataBuilder
      .enableAnnotations()
      .addEntityType(ENTITY_NAME, undefined, (builder: any) =>
        builder.addKeyProp("Id", ODataTypesV4.Guid).addProp("Status", ODataTypesV4.Byte, true),
      )
      .addExternalAnnotations(`${withNs(ENTITY_NAME)}/Status`, [allowedValues(STATUS_VALUES)], "SomeContext");

    expectUntouched(await doDigest());
  });

  test("the terms may be written fully qualified", async () => {
    odataBuilder
      .addEntityType(ENTITY_NAME, undefined, (builder: any) =>
        builder.addKeyProp("Id", ODataTypesV4.Guid).addProp("Status", ODataTypesV4.Byte, true),
      )
      .addExternalAnnotations(`${withNs(ENTITY_NAME)}/Status`, [
        allowedValues(STATUS_VALUES, { fullyQualified: true }),
      ]);

    const result = await doDigest();
    expect(result.getEnums().length).toBe(1);
    expect(propOf(result, "Status").fqType).toBe(withNs("Status"));
  });

  test("a symbolic name on something other than an allowed value is ignored", async () => {
    odataBuilder
      .enableAnnotations()
      .addEntityType(ENTITY_NAME, undefined, (builder: any) =>
        builder.addKeyProp("Id", ODataTypesV4.Guid).addProp("Status", ODataTypesV4.Byte, true),
      )
      .addExternalAnnotations(`${withNs(ENTITY_NAME)}/Status`, [core("SymbolicName", { string: "Status" })]);

    expectUntouched(await doDigest());
  });
}
