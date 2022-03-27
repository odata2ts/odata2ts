import { ODataModelBuilder, ODataVersion } from "./builder/ODataModelBuilder";
import { digest } from "../../src/data-model/DataModelDigestion";
import { EmitModes, Modes, RunOptions } from "../../src/OptionModel";
import { OdataTypes } from "../../src/data-model/edmx/ODataEdmxModel";
import { DataTypes, ModelTypes } from "../../src/data-model/DataTypeModel";

const NOOP_FN = () => {};

describe("ComplexType And Enum Digestion Test", () => {
  const SERVICE_NAME = "ComplexAndEnum";
  const ENTITY_NAME = "Product";

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

  test("EnumType: enum type", async () => {
    odataBuilder
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder.addKeyProp("id", OdataTypes.String).addProp("myChoice", `${SERVICE_NAME}.Choice`)
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
      required: false,
      type: "Choice",
    });
  });
  test("EnumType: enum collection", async () => {
    odataBuilder
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder.addKeyProp("id", OdataTypes.String).addProp("myChoices", `Collection(${SERVICE_NAME}.Choice)`)
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
      qObject: "qEnumCollection",
      required: false,
      type: "Choice",
    });
  });

  test("ComplexType: complex type", async () => {
    odataBuilder
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder.addKeyProp("id", OdataTypes.String).addProp("branding", `${SERVICE_NAME}.Brand`)
      )
      .addComplexType("Brand", undefined, (builder) => builder.addProp("naming", OdataTypes.String));

    const result = await doDigest();
    const model = result.getModel(ENTITY_NAME);

    expect(model).toBeTruthy();
    expect(model.props[1]).toEqual({
      dataType: DataTypes.ModelType,
      isCollection: false,
      name: "branding",
      odataName: "branding",
      odataType: `${SERVICE_NAME}.Brand`,
      qObject: "qBrand",
      required: false,
      type: "Brand",
    });
  });

  test("ComplexType: base class hierarchy", async () => {
    odataBuilder
      .addComplexType("GrandParent", undefined, (builder) =>
        builder.addProp("name", OdataTypes.String).addProp("myChoice", `${SERVICE_NAME}.Choice`)
      )
      .addComplexType("Parent", "GrandParent", (builder) => builder.addProp("parentalAdvice", OdataTypes.Boolean))
      .addComplexType("Child", "Parent", (builder) => builder.addProp("Ch1ld1shF4n", OdataTypes.String))
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder.addKeyProp("id", OdataTypes.String).addProp("kids", `${SERVICE_NAME}.Child`)
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
        odataType: OdataTypes.String,
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
      odataType: OdataTypes.Boolean,
      type: "boolean",
    };
    const expectedChildProp = {
      dataType: DataTypes.PrimitiveType,
      name: "ch1ld1shF4n",
      odataType: OdataTypes.String,
      type: "string",
    };

    const result = await doDigest();
    const model = result.getModel(ENTITY_NAME);

    expect(model.props[1]).toMatchObject({});
    expect(result.getModel("GrandParent")).toMatchObject({
      name: "GrandParent",
      odataName: "GrandParent",
      keyNames: [],
      props: expectedGrandParentProps,
      baseClasses: [],
      baseProps: [],
    });
    expect(result.getModel("Parent")).toMatchObject({
      name: "Parent",
      keyNames: [],
      props: [expectedParentProp],
      baseClasses: ["GrandParent"],
      baseProps: expectedGrandParentProps,
    });
    expect(result.getModel("Child")).toMatchObject({
      name: "Child",
      keyNames: [],
      props: [expectedChildProp],
      baseClasses: ["Parent"],
      baseProps: [...expectedGrandParentProps, expectedParentProp],
    });
  });
});
