import { Project, SourceFile } from "ts-morph";
import { EmitModes, Modes, RunOptions } from "../../../src/OptionModel";
import { createFixtureComparator, FixtureComparator } from "../comparator/FixtureComparator";
import { ODataTypesV4 } from "../../../src/data-model/edmx/ODataEdmxModelV4";
import { digest } from "../../../src/data-model/DataModelDigestionV4";
import { DataModel } from "../../../src/data-model/DataModel";
import { ODataModelBuilderV4 } from "../../data-model/builder/v4/ODataModelBuilderV4";

export const SERVICE_NAME = "Tester";
export const ENTITY_NAME = "Book";

export type GeneratorFunction = (dataModel: DataModel, sourceFile: SourceFile) => void;

export function createEntityBasedGenerationTests(
  testSuiteName: string,
  fixtureBasePath: string,
  generate: GeneratorFunction
) {
  let runOptions: RunOptions;
  let odataBuilder: ODataModelBuilderV4;

  const project: Project = new Project({
    skipAddingFilesFromTsConfig: true,
  });
  let fixtureComparator: FixtureComparator;

  beforeAll(async () => {
    fixtureComparator = await createFixtureComparator(fixtureBasePath);
  });

  beforeEach(() => {
    odataBuilder = new ODataModelBuilderV4(SERVICE_NAME);
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
    odataBuilder.addComplexType("Brand", undefined, (builder) => builder.addProp("naming", ODataTypesV4.Boolean));

    // when generating model
    // then match fixture text
    await generateAndCompare("complexType", "complex-min.ts");
  });

  test(`${testSuiteName}: one minimal model`, async () => {
    // given one minimal model
    odataBuilder.addEntityType(ENTITY_NAME, undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.Int32));

    // when generating model
    // then match fixture text
    await generateAndCompare("oneModel", "entity-min.ts");
  });

  test(`${testSuiteName}: one max model`, async () => {
    // given one max model
    odataBuilder.addEntityType(ENTITY_NAME, undefined, (builder) =>
      builder
        .addKeyProp("id", ODataTypesV4.Guid)
        .addProp("requiredOption", ODataTypesV4.Boolean, false)
        .addProp("time", ODataTypesV4.Time)
        .addProp("optionalDate", ODataTypesV4.Date)
        .addProp("dateTimeOffset", ODataTypesV4.DateTimeOffset)
        .addProp("TestDecimal", ODataTypesV4.Decimal)
        .addProp("testBinary", ODataTypesV4.Binary)
        .addProp("testAny", "Edm.AnythingYouWant")
        .addProp("multipleStrings", `Collection(${ODataTypesV4.String})`)
        .addProp("multipleNumbers", `Collection(${ODataTypesV4.Decimal})`)
        .addProp("multipleBooleans", `Collection(${ODataTypesV4.Boolean})`)
        .addProp("multipleIds", `Collection(${ODataTypesV4.Guid})`)
        .addProp("multipleTimes", `Collection(${ODataTypesV4.Time})`)
        .addProp("multipleDates", `Collection(${ODataTypesV4.Date})`)
        .addProp("multipleDateTimeOffsets", `Collection(${ODataTypesV4.DateTimeOffset})`)
        .addProp("multipleBinaries", `Collection(${ODataTypesV4.Binary})`)
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("oneMaxModel", "entity-max.ts");
  });

  test(`${testSuiteName}: entity relationships`, async () => {
    // given one minimal model
    odataBuilder
      .addEntityType("author", undefined, (builder) =>
        builder.addKeyProp("id", ODataTypesV4.Int32).addProp("name", ODataTypesV4.Boolean, false)
      )
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV4.Int32)
          .addProp("author", `${SERVICE_NAME}.Author`, false)
          .addProp("relatedAuthors", `Collection(${SERVICE_NAME}.Author)`)
      );

    // when generating model
    // then match fixture text
    await generateAndCompare("entity-relationships", "entity-relationships.ts");
  });

  test(`${testSuiteName}: base class`, async () => {
    // given an entity hierarchy
    odataBuilder.addEntityType("GrandParent", undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.Int32));
    odataBuilder.addEntityType("Parent", "GrandParent", (builder) =>
      builder.addProp("parentalAdvice", ODataTypesV4.Boolean)
    );
    odataBuilder.addEntityType("Child", "Parent", (builder) => builder.addProp("Ch1ld1shF4n", ODataTypesV4.Boolean));

    // when generating model
    // then match fixture text
    await generateAndCompare("baseClass", "entity-hierarchy.ts");
  });

  test(`${testSuiteName}: entity & enum`, async () => {
    // given an entity with enum props
    odataBuilder
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV4.Int32)
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
      .addComplexType("publishingMethod", undefined, (builder) => builder.addProp("name", ODataTypesV4.Boolean))
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV4.Int32)
          .addProp("method", `${SERVICE_NAME}.PublishingMethod`, false)
          .addProp("altMethods", `Collection(${SERVICE_NAME}.PublishingMethod)`)
      );

    // when generating model
    // then match fixture text
    await generateAndCompare("entityComplex", "entity-complex.ts");
  });
}
