import { Project, SourceFile } from "ts-morph";
import { EmitModes, Modes, RunOptions } from "../../src/OptionModel";
import { ODataModelBuilder, ODataVersion } from "../data-model/builder/ODataModelBuilder";
import { createFixtureComparator, FixtureComparator } from "./comparator/FixtureComparator";
import { OdataTypes } from "../../src/data-model/edmx/ODataEdmxModel";
import { digest } from "../../src/data-model/DataModelDigestion";
import { DataModel } from "../../src/data-model/DataModel";

export const SERVICE_NAME = "Tester";
export const ENTITY_NAME = "Book";

export type GeneratorFunction = (dataModel: DataModel, sourceFile: SourceFile) => void;

export function createEntityBasedGenerationTests(
  testSuiteName: string,
  fixtureBasePath: string,
  generate: GeneratorFunction
) {
  let runOptions: RunOptions;
  let odataBuilder: ODataModelBuilder;

  const project: Project = new Project({
    skipAddingFilesFromTsConfig: true,
  });
  let fixtureComparator: FixtureComparator;

  beforeAll(async () => {
    fixtureComparator = await createFixtureComparator(fixtureBasePath);
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

    generate(dataModel, sourceFile);

    return sourceFile.getFullText().trim();
  }

  async function generateAndCompare(id: string, fixturePath: string) {
    const result = await doGenerate(id);
    await fixtureComparator.compareWithFixture(result, fixturePath);
  }

  test(`${testSuiteName}: smoke test`, async () => {
    // given an empty data model

    // when generating model
    const result = await doGenerate("smokeTest");

    // then nothing really happened
    expect(result).toEqual("");
  });

  test(`${testSuiteName}: one enum type`, async () => {
    // given only a single enum type
    odataBuilder.addEnumType("Choice", [
      { name: "A", value: 1 },
      { name: "B", value: 2 },
    ]);

    // when generating model
    // then match fixture text
    await generateAndCompare("oneEnumType", "enum-min.ts");
  });

  test(`${testSuiteName}: complex type`, async () => {
    // given one minimal model
    odataBuilder.addComplexType("Brand", undefined, (builder) => builder.addProp("naming", OdataTypes.String));

    // when generating model
    // then match fixture text
    await generateAndCompare("complexType", "complex-min.ts");
  });

  test(`${testSuiteName}: one minimal model`, async () => {
    // given one minimal model
    odataBuilder.addEntityType(ENTITY_NAME, undefined, (builder) => builder.addKeyProp("id", OdataTypes.String));

    // when generating model
    // then match fixture text
    await generateAndCompare("oneModel", "entity-min.ts");
  });

  test(`${testSuiteName}: one max model`, async () => {
    // given one minimal model
    odataBuilder.addEntityType(ENTITY_NAME, undefined, (builder) =>
      builder
        .addKeyProp("id", OdataTypes.Guid)
        .addProp("requiredOption", OdataTypes.Boolean, false)
        .addProp("time", OdataTypes.Time)
        .addProp("optionalDate", OdataTypes.Date)
        .addProp("dateTimeOffset", OdataTypes.DateTimeOffset)
        .addProp("TestDecimal", OdataTypes.Decimal)
        .addProp("testBinary", OdataTypes.Binary)
        .addProp("testAny", "Edm.AnythingYouWant")
        .addProp("multipleStrings", `Collection(${OdataTypes.String})`)
        .addProp("multipleNumbers", `Collection(${OdataTypes.Decimal})`)
        .addProp("multipleBooleans", `Collection(${OdataTypes.Boolean})`)
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("oneMaxModel", "entity-max.ts");
  });

  test(`${testSuiteName}: entity relationships`, async () => {
    // given one minimal model
    odataBuilder
      .addEntityType("author", undefined, (builder) =>
        builder.addKeyProp("id", OdataTypes.String).addProp("name", OdataTypes.String, false)
      )
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder
          .addKeyProp("id", OdataTypes.String)
          .addProp("author", `${SERVICE_NAME}.Author`, false)
          .addProp("relatedAuthors", `Collection(${SERVICE_NAME}.Author)`)
      );

    // when generating model
    // then match fixture text
    await generateAndCompare("entity-relationships", "entity-relationships.ts");
  });

  test(`${testSuiteName}: base class`, async () => {
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

  test(`${testSuiteName}: entity & enum`, async () => {
    // given an entity with enum props
    odataBuilder
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder
          .addKeyProp("id", OdataTypes.String)
          .addProp("myChoice", `${SERVICE_NAME}.Choice`, false)
          .addProp("otherChoices", `Collection(${SERVICE_NAME}.Choice)`)
      )
      .addEnumType("Choice", [
        { name: "A", value: 1 },
        { name: "B", value: 2 },
      ]);

    // when generating model
    // then match fixture text
    await generateAndCompare("entityEnum", "entity-enum.ts");
  });

  test(`${testSuiteName}: entity & complex entity`, async () => {
    // given an entity with enum props
    odataBuilder
      .addComplexType("publishingMethod", undefined, (builder) => builder.addProp("name", OdataTypes.String))
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder
          .addKeyProp("id", OdataTypes.String)
          .addProp("method", `${SERVICE_NAME}.PublishingMethod`, false)
          .addProp("altMethods", `Collection(${SERVICE_NAME}.PublishingMethod)`)
      );

    // when generating model
    // then match fixture text
    await generateAndCompare("entityComplex", "entity-complex.ts");
  });
}
