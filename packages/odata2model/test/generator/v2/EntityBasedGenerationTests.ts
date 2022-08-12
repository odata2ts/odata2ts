import { Project, SourceFile } from "ts-morph";
import { EmitModes, Modes, RunOptions } from "../../../src/OptionModel";
import { createFixtureComparator, FixtureComparator } from "../comparator/FixtureComparator";
import { ODataTypesV3 } from "../../../src/data-model/edmx/ODataEdmxModelV3";
import { digest } from "../../../src/data-model/DataModelDigestionV2";
import { DataModel } from "../../../src/data-model/DataModel";
import { ODataModelBuilderV2 } from "../../data-model/builder/v2/ODataModelBuilderV2";

export const SERVICE_NAME = "Tester";
export const ENTITY_NAME = "Book";

export type GeneratorFunction = (dataModel: DataModel, sourceFile: SourceFile) => void;

export function createEntityBasedGenerationTests(
  testSuiteName: string,
  fixtureBasePath: string,
  generate: GeneratorFunction
) {
  let runOptions: RunOptions;
  let odataBuilder: ODataModelBuilderV2;

  const project: Project = new Project({
    skipAddingFilesFromTsConfig: true,
  });
  let fixtureComparator: FixtureComparator;

  beforeAll(async () => {
    fixtureComparator = await createFixtureComparator(fixtureBasePath);
  });

  beforeEach(() => {
    odataBuilder = new ODataModelBuilderV2(SERVICE_NAME);
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
    odataBuilder.addComplexType("Brand", undefined, (builder) => builder.addProp("naming", ODataTypesV3.Boolean));

    // when generating model
    // then match fixture text
    await generateAndCompare("complexType", "complex-min.ts");
  });

  test(`${testSuiteName}: one minimal model`, async () => {
    // given one minimal model
    odataBuilder.addEntityType(ENTITY_NAME, undefined, (builder) => builder.addKeyProp("id", ODataTypesV3.Boolean));

    // when generating model
    // then match fixture text
    await generateAndCompare("oneModel", "entity-min.ts");
  });

  test(`${testSuiteName}: one max model`, async () => {
    // given one minimal model
    odataBuilder.addEntityType(ENTITY_NAME, undefined, (builder) =>
      builder
        .addKeyProp("id", ODataTypesV3.Guid)
        .addProp("requiredOption", ODataTypesV3.Boolean, false)
        .addProp("time", ODataTypesV3.Time)
        .addProp("optionalDate", ODataTypesV3.DateTime)
        .addProp("dateTimeOffset", ODataTypesV3.DateTimeOffset)
        .addProp("TestDecimal", ODataTypesV3.Decimal)
        .addProp("testInt16", ODataTypesV3.Int16)
        .addProp("testInt32", ODataTypesV3.Int32)
        .addProp("testInt64", ODataTypesV3.Int64)
        .addProp("testSingle", ODataTypesV3.Single)
        .addProp("testByte", ODataTypesV3.Byte)
        .addProp("testSByte", ODataTypesV3.SByte)
        .addProp("testDouble", ODataTypesV3.Double)
        .addProp("testBinary", ODataTypesV3.Binary)
        .addProp("testAny", "Edm.AnythingYouWant")
        .addProp("multipleIds", `Collection(${ODataTypesV3.Guid})`)
        .addProp("multipleStrings", `Collection(${ODataTypesV3.String})`)
        .addProp("multipleBooleans", `Collection(${ODataTypesV3.Boolean})`)
        .addProp("multipleTimes", `Collection(${ODataTypesV3.Time})`)
        .addProp("multipleDateTimes", `Collection(${ODataTypesV3.DateTime})`)
        .addProp("multipleDateTimeOffsets", `Collection(${ODataTypesV3.DateTimeOffset})`)
        .addProp("multipleInt16", `Collection(${ODataTypesV3.Int16})`)
        .addProp("multipleDecimals", `Collection(${ODataTypesV3.Decimal})`)
        .addProp("multipleBinaries", `Collection(${ODataTypesV3.Binary})`)
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("oneMaxModel", "entity-max-v2.ts");
  });

  test(`${testSuiteName}: entity relationships`, async () => {
    // given one minimal model
    odataBuilder
      .addEntityType("Author", undefined, (builder) =>
        builder.addKeyProp("id", ODataTypesV3.Int32).addProp("name", ODataTypesV3.Boolean, true)
      )
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV3.Int32)
          .addProp("author", `${SERVICE_NAME}.Author`, false)
          .addProp("altAuthor", `${SERVICE_NAME}.Author`, true)
          .addProp("relatedAuthors", `Collection(${SERVICE_NAME}.Author)`)
      );

    // when generating model
    // then match fixture text
    await generateAndCompare("entity-relationships", "entity-relationships-v2.ts");
  });

  test(`${testSuiteName}: base class`, async () => {
    // given an entity hierarchy
    odataBuilder.addEntityType("GrandParent", undefined, (builder) => builder.addKeyProp("id", ODataTypesV3.Boolean));
    odataBuilder.addEntityType("Parent", "GrandParent", (builder) =>
      builder.addProp("parentalAdvice", ODataTypesV3.Boolean)
    );
    odataBuilder.addEntityType("Child", "Parent", (builder) => builder.addProp("Ch1ld1shF4n", ODataTypesV3.Boolean));

    // when generating model
    // then match fixture text
    await generateAndCompare("baseClass", "entity-hierarchy.ts");
  });

  test(`${testSuiteName}: entity & enum`, async () => {
    // given an entity with enum props
    odataBuilder
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV3.Boolean)
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

  test(`${testSuiteName}: entity & complex type`, async () => {
    // given an entity with enum props
    odataBuilder
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV3.Boolean)
          .addProp("method", `${SERVICE_NAME}.PublishingMethod`, false)
          .addProp("altMethod", `${SERVICE_NAME}.PublishingMethod`, true)
          .addProp("altMethods", `Collection(${SERVICE_NAME}.PublishingMethod)`)
      )
      .addComplexType("PublishingMethod", undefined, (builder) =>
        builder.addProp("name", ODataTypesV3.Boolean).addProp("city", `${SERVICE_NAME}.City`)
      )
      .addComplexType("City", undefined, (builder) => {
        builder.addProp("choice", ODataTypesV3.Boolean, false).addProp("optChoice", ODataTypesV3.Boolean);
      });

    // when generating model
    // then match fixture text
    await generateAndCompare("entityComplex", "entity-complex.ts");
  });
}
