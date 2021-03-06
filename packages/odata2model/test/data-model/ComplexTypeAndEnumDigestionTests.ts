import { digest } from "../../src/data-model/DataModelDigestionV4";
import { EmitModes, Modes, RunOptions } from "../../src/OptionModel";
import { ODataTypesV4 } from "../../src/data-model/edmx/ODataEdmxModelV4";
import { DataTypes } from "../../src/data-model/DataTypeModel";
import { ODataModelBuilderV4 } from "./builder/v4/ODataModelBuilderV4";

export function createComplexAndEnumTests() {
  const SERVICE_NAME = "ComplexAndEnum";
  const ENTITY_NAME = "Product";

  let odataBuilder: ODataModelBuilderV4;
  let runOpts: RunOptions;

  function doDigest() {
    return digest(odataBuilder.getSchema(), runOpts);
  }

  beforeEach(() => {
    odataBuilder = new ODataModelBuilderV4(SERVICE_NAME);
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

  test("EnumType: enum type", async () => {
    odataBuilder
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder.addKeyProp("id", ODataTypesV4.String).addProp("myChoice", `${SERVICE_NAME}.Choice`)
      )
      .addEnumType("Choice", [
        { name: "A", value: 1 },
        { name: "B", value: 9 },
        { name: "C", value: 4 },
      ]);
    const result = await doDigest();
    const model = result.getModel(ENTITY_NAME);

    expect(model).toBeTruthy();
    expect(model.props[1]).toEqual({
      dataType: DataTypes.EnumType,
      isCollection: false,
      name: "myChoice",
      odataName: "myChoice",
      odataType: `${SERVICE_NAME}.Choice`,
      qObject: undefined,
      qPath: "QEnumPath",
      required: false,
      type: "Choice",
    });
  });
  test("EnumType: enum collection", async () => {
    odataBuilder
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder.addKeyProp("id", ODataTypesV4.String).addProp("myChoices", `Collection(${SERVICE_NAME}.Choice)`)
      )
      .addEnumType("Choice", [
        { name: "A", value: 1 },
        { name: "B", value: 9 },
        { name: "C", value: 4 },
      ]);
    const result = await doDigest();
    const model = result.getModel(ENTITY_NAME);

    expect(model).toBeTruthy();
    expect(model.props[1]).toEqual({
      dataType: DataTypes.EnumType,
      isCollection: true,
      name: "myChoices",
      odataName: "myChoices",
      odataType: `Collection(${SERVICE_NAME}.Choice)`,
      qObject: "QEnumCollection",
      qPath: "QEnumPath",
      required: false,
      type: "Choice",
    });
  });

  test("ComplexType: complex type", async () => {
    odataBuilder
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder.addKeyProp("id", ODataTypesV4.String).addProp("branding", `${SERVICE_NAME}.Brand`)
      )
      .addComplexType("Brand", undefined, (builder) => builder.addProp("naming", ODataTypesV4.String));

    const result = await doDigest();
    const model = result.getModel(ENTITY_NAME);

    expect(model).toBeTruthy();
    expect(model.props[1]).toEqual({
      dataType: DataTypes.ComplexType,
      isCollection: false,
      name: "branding",
      odataName: "branding",
      odataType: `${SERVICE_NAME}.Brand`,
      qObject: "QBrand",
      qPath: "QEntityPath",
      required: false,
      type: "Brand",
    });
  });

  test("ComplexType: base class hierarchy", async () => {
    odataBuilder
      .addComplexType("GrandParent", undefined, (builder) =>
        builder.addProp("name", ODataTypesV4.String).addProp("myChoice", `${SERVICE_NAME}.Choice`)
      )
      .addComplexType("Parent", "GrandParent", (builder) => builder.addProp("parentalAdvice", ODataTypesV4.Boolean))
      .addComplexType("Child", "Parent", (builder) => builder.addProp("Ch1ld1shF4n", ODataTypesV4.String))
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder.addKeyProp("id", ODataTypesV4.String).addProp("kids", `${SERVICE_NAME}.Child`)
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
        odataType: `${SERVICE_NAME}.Choice`,
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
    const model = result.getModel(ENTITY_NAME);

    expect(model.props[1]).toMatchObject({});
    expect(result.getComplexType("GrandParent")).toMatchObject({
      name: "GrandParent",
      odataName: "GrandParent",
      props: expectedGrandParentProps,
      baseClasses: [],
      baseProps: [],
    });
    expect(result.getComplexType("Parent")).toMatchObject({
      name: "Parent",
      props: [expectedParentProp],
      baseClasses: ["GrandParent"],
      baseProps: expectedGrandParentProps,
    });
    expect(result.getComplexType("Child")).toMatchObject({
      name: "Child",
      props: [expectedChildProp],
      baseClasses: ["Parent"],
      baseProps: [...expectedGrandParentProps, expectedParentProp],
    });
  });
}
