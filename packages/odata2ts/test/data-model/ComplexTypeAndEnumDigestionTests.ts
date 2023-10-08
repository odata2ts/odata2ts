import { ODataTypesV4 } from "@odata2ts/odata-core";

import { RunOptions } from "../../src";
import { digest } from "../../src/data-model/DataModelDigestionV4";
import { DataTypes } from "../../src/data-model/DataTypeModel";
import { NamingHelper } from "../../src/data-model/NamingHelper";
import { getTestConfig } from "../test.config";
import { ODataModelBuilderV4 } from "./builder/v4/ODataModelBuilderV4";

export function createComplexAndEnumTests() {
  const SERVICE_NAME = "ComplexAndEnum";
  const ENTITY_NAME = "Product";

  function withNs(name: string) {
    return `${SERVICE_NAME}.${name}`;
  }

  const FQ_ENTITY_NAME = withNs(ENTITY_NAME);

  let odataBuilder: ODataModelBuilderV4;
  let runOpts: Omit<RunOptions, "source" | "output"> = getTestConfig();

  function doDigest() {
    const namingHelper = new NamingHelper(runOpts, SERVICE_NAME);
    return digest(odataBuilder.getSchemas(), runOpts, namingHelper);
  }

  beforeEach(() => {
    odataBuilder = new ODataModelBuilderV4(SERVICE_NAME);
  });

  test("EnumType: enum type", async () => {
    odataBuilder
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder.addKeyProp("id", ODataTypesV4.String).addProp("myChoice", withNs("Choice"))
      )
      .addEnumType("Choice", [
        { name: "A", value: 1 },
        { name: "B", value: 9 },
        { name: "C", value: 4 },
      ]);
    const result = await doDigest();
    const model = result.getModel(FQ_ENTITY_NAME);

    expect(model).toBeTruthy();
    expect(model.props[1]).toEqual({
      dataType: DataTypes.EnumType,
      isCollection: false,
      managed: undefined,
      type: "Choice",
      fqType: withNs("Choice"),
      required: false,
      name: "myChoice",
      odataName: "myChoice",
      odataType: withNs("Choice"),
      qObject: undefined,
      qPath: "QEnumPath",
      qParam: "QEnumParam",
    });
  });

  test("EnumType: enum collection", async () => {
    odataBuilder
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder.addKeyProp("id", ODataTypesV4.String).addProp("myChoices", `Collection(${withNs("Choice")})`)
      )
      .addEnumType("Choice", [
        { name: "A", value: 1 },
        { name: "B", value: 9 },
        { name: "C", value: 4 },
      ]);
    const result = await doDigest();
    const model = result.getModel(FQ_ENTITY_NAME);

    expect(model).toBeTruthy();
    expect(model.props[1]).toEqual({
      dataType: DataTypes.EnumType,
      isCollection: true,
      managed: undefined,
      type: "Choice",
      fqType: withNs("Choice"),
      required: false,
      name: "myChoices",
      odataName: "myChoices",
      odataType: `Collection(${withNs("Choice")})`,
      qObject: "QEnumCollection",
      qPath: "QEnumPath",
      qParam: "QEnumParam",
    });
  });

  test("ComplexType: complex type", async () => {
    odataBuilder
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder.addKeyProp("id", ODataTypesV4.String).addProp("branding", withNs("Brand"))
      )
      .addComplexType("Brand", undefined, (builder) => builder.addProp("naming", ODataTypesV4.String));

    const result = await doDigest();
    const model = result.getModel(FQ_ENTITY_NAME);

    expect(model).toBeTruthy();
    expect(model.props[1]).toEqual({
      dataType: DataTypes.ComplexType,
      isCollection: false,
      managed: undefined,
      required: false,
      type: "Brand",
      fqType: withNs("Brand"),
      name: "branding",
      odataName: "branding",
      odataType: withNs("Brand"),
      qObject: "QBrand",
      qPath: "QEntityPath",
      qParam: "QComplexParam",
    });
  });

  test("ComplexType: base class hierarchy", async () => {
    odataBuilder
      .addComplexType("GrandParent", undefined, (builder) =>
        builder.addProp("name", ODataTypesV4.String).addProp("myChoice", withNs("Choice"))
      )
      .addComplexType("Parent", withNs("GrandParent"), (builder) =>
        builder.addProp("parentalAdvice", ODataTypesV4.Boolean)
      )
      .addComplexType("Child", withNs("Parent"), (builder) => builder.addProp("Ch1ld1shF4n", ODataTypesV4.String))
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder.addKeyProp("id", ODataTypesV4.String).addProp("kids", withNs("Child"))
      )
      .addEnumType("Choice", [
        { name: "A", value: 1 },
        { name: "B", value: 9 },
        { name: "C", value: 4 },
      ]);

    const expectedGrandParentProps = [
      {
        dataType: DataTypes.PrimitiveType,
        name: "name",
        odataType: ODataTypesV4.String,
        required: false,
        type: "string",
      },
      {
        dataType: DataTypes.EnumType,
        isCollection: false,
        name: "myChoice",
        odataName: "myChoice",
        odataType: withNs("Choice"),
        qObject: undefined,
        required: false,
        type: "Choice",
      },
    ];
    const expectedParentProp = {
      dataType: DataTypes.PrimitiveType,
      name: "parentalAdvice",
      odataType: ODataTypesV4.Boolean,
      type: "boolean",
    };
    const expectedChildProp = {
      dataType: DataTypes.PrimitiveType,
      name: "ch1ld1shF4n",
      odataType: ODataTypesV4.String,
      type: "string",
    };

    const result = await doDigest();
    const model = result.getModel(FQ_ENTITY_NAME);

    expect(model.props[1]).toMatchObject({});
    expect(result.getComplexType(withNs("GrandParent"))).toMatchObject({
      name: "GrandParent",
      odataName: "GrandParent",
      props: expectedGrandParentProps,
      baseClasses: [],
      baseProps: [],
    });
    expect(result.getComplexType(withNs("Parent"))).toMatchObject({
      name: "Parent",
      props: [expectedParentProp],
      baseClasses: [withNs("GrandParent")],
      baseProps: expectedGrandParentProps,
    });
    expect(result.getComplexType(withNs("Child"))).toMatchObject({
      name: "Child",
      props: [expectedChildProp],
      baseClasses: [withNs("Parent")],
      baseProps: [...expectedGrandParentProps, expectedParentProp],
    });
  });
}
