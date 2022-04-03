import { Project } from "ts-morph";

import { OdataTypes } from "../../src/data-model/edmx/ODataEdmxModel";
import { EmitModes, Modes, RunOptions } from "../../src/OptionModel";
import { generateModels } from "../../src/generator";
import { digest } from "../../src/data-model/DataModelDigestion";

import { ODataModelBuilder, ODataVersion } from "../data-model/builder/ODataModelBuilder";
import { createFixtureComparator, FixtureComparator } from "./comparator/FixtureComparator";

describe("Model Generator Tests", () => {
  const SERVICE_NAME = "Tester";
  const ENTITY_NAME = "Book";

  let project: Project;

  let runOptions: RunOptions;
  let odataBuilder: ODataModelBuilder;
  let fixtureComparator: FixtureComparator;

  beforeAll(async () => {
    project = new Project({
      skipAddingFilesFromTsConfig: true,
    });
    fixtureComparator = await createFixtureComparator("generator/model");
  });

  beforeEach(() => {
    odataBuilder = new ODataModelBuilder(ODataVersion.V4, SERVICE_NAME);
    runOptions = {
      mode: Modes.all,
      emitMode: EmitModes.js_dts,
      output: "ignore",
      prettier: false,
      debug: false,
      modelPrefix: "",
      modelSuffix: "",
    };
  });

  async function doGenerate(id: string) {
    const sourceFile = project.createSourceFile(id);
    const dataModel = await digest(odataBuilder.getSchema(), runOptions);

    generateModels(dataModel, sourceFile);

    return sourceFile.getFullText().trim();
  }

  async function generateAndCompare(id: string, fixturePath: string) {
    const result = await doGenerate(id);
    await fixtureComparator.compareWithFixture(result, fixturePath);
  }

  test("smoke test", async () => {
    // given an empty data model

    // when generating model
    const result = await doGenerate("smokeTest");

    // then nothing really happened
    expect(result).toEqual("");
  });

  test("Model Generator: one enum type", async () => {
    // given only a single enum type
    odataBuilder.addEnumType("Choice", [
      { name: "A", value: 1 },
      { name: "B", value: 2 },
    ]);

    // when generating model
    // then match fixture text
    await generateAndCompare("oneEnumType", "enum-min.ts");
  });

  test("Model Generator: complex type", async () => {
    // given one minimal model
    odataBuilder.addComplexType("Brand", undefined, (builder) => builder.addProp("naming", OdataTypes.String));

    // when generating model
    // then match fixture text
    await generateAndCompare("complexType", "complex-min.ts");
  });

  test("Model Generator: one minimal model", async () => {
    // given one minimal model
    odataBuilder.addEntityType(ENTITY_NAME, undefined, (builder) => builder.addKeyProp("id", OdataTypes.String));

    // when generating model
    // then match fixture text
    await generateAndCompare("oneModel", "entity-min.ts");
  });

  test("Model Generator: one max model", async () => {
    // given one minimal model
    odataBuilder.addEntityType(ENTITY_NAME, undefined, (builder) =>
      builder
        .addKeyProp("id", OdataTypes.Guid)
        .addProp("isTrue", OdataTypes.Boolean, false)
        .addProp("time", OdataTypes.Time)
        .addProp("optionalDate", OdataTypes.Date)
        .addProp("dateTimeOffset", OdataTypes.DateTimeOffset)
        .addProp("TestInt16", OdataTypes.Int16)
        .addProp("TestInt32", OdataTypes.Int32)
        .addProp("TestInt64", OdataTypes.Int64)
        .addProp("TestDecimal", OdataTypes.Decimal)
        .addProp("TestDouble", OdataTypes.Double)
        .addProp("testByte", OdataTypes.Byte)
        .addProp("testSByte", OdataTypes.SByte)
        .addProp("testSingle", OdataTypes.Single)
        .addProp("testBinary", OdataTypes.Binary)
        .addProp("testAny", "Edm.AnythingYouWant")
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("oneMaxModel", "entity-max.ts");
  });

  test("Model Generator: entity relationships", async () => {
    // given one minimal model
    odataBuilder
      .addComplexType("Brand", undefined, (builder) => builder.addProp("color", OdataTypes.String))
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder
          .addKeyProp("id", OdataTypes.String)
          .addProp("branding", `${SERVICE_NAME}.Brand`)
          .addProp("multipleBrands", `Collection(${SERVICE_NAME}.Brand)`)
          .addProp("multipleStrings", `Collection(Edm.String)`)
          .addProp("multipleNumbers", `Collection(Edm.Decimal)`)
      );

    // when generating model
    // then match fixture text
    await generateAndCompare("entity-relationships", "entity-relationships.ts");
  });

  test("Model Generator: base class", async () => {
    // given an entity hierarchy
    odataBuilder.addEntityType("GrandParent", undefined, (builder) => builder.addKeyProp("id", OdataTypes.String));
    odataBuilder.addEntityType("Parent", "GrandParent", (builder) =>
      builder.addProp("parentalAdvice", OdataTypes.Boolean)
    );
    odataBuilder.addEntityType("Child", "Parent", (builder) => builder.addProp("Ch1ld1shF4n", OdataTypes.String));

    // when generating model
    // then match fixture text
    await generateAndCompare("baseClass", "entity-hierarchy.ts");
  });
});
