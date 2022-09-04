import { digest } from "../../../src/data-model/DataModelDigestionV4";
import { ODataTypesV4 } from "../../../src/data-model/edmx/ODataEdmxModelV4";
import { EntityBasedGeneratorFunction } from "../../../src/FactoryFunctionModel";
import { EmitModes, Modes, RunOptions } from "../../../src/OptionModel";
import { ODataModelBuilderV4 } from "../../data-model/builder/v4/ODataModelBuilderV4";
import { FixtureComparator, createFixtureComparator } from "../comparator/FixtureComparator";
import { FixtureComparatorHelper, createHelper } from "../comparator/FixtureComparatorHelper";

export const SERVICE_NAME = "Tester";
export const ENTITY_NAME = "Book";

export function createEntityBasedGenerationTests(
  testSuiteName: string,
  fixtureBasePath: string,
  generate: EntityBasedGeneratorFunction
) {
  let odataBuilder: ODataModelBuilderV4;
  let fixtureComparatorHelper: FixtureComparatorHelper;

  beforeAll(async () => {
    fixtureComparatorHelper = await createHelper(fixtureBasePath, digest, generate);
  });

  beforeEach(() => {
    odataBuilder = new ODataModelBuilderV4(SERVICE_NAME);
  });

  async function generateAndCompare(id: string, fixturePath: string, runOptions?: RunOptions) {
    await fixtureComparatorHelper.generateAndCompare(id, fixturePath, odataBuilder.getSchema(), runOptions);
  }

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
    odataBuilder.addEntityType(ENTITY_NAME, undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.Boolean));

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
      .addEntityType("Author", undefined, (builder) =>
        builder.addKeyProp("id", ODataTypesV4.Int32).addProp("name", ODataTypesV4.Boolean, true)
      )
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV4.Int32)
          .addProp("author", `${SERVICE_NAME}.Author`, false)
          .addProp("altAuthor", `${SERVICE_NAME}.Author`, true)
          .addProp("relatedAuthors", `Collection(${SERVICE_NAME}.Author)`)
      );

    // when generating model
    // then match fixture text
    await generateAndCompare("entity-relationships", "entity-relationships.ts");
  });

  test(`${testSuiteName}: base class`, async () => {
    // given an entity hierarchy
    odataBuilder.addEntityType("GrandParent", undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.Boolean));
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
          .addKeyProp("id", ODataTypesV4.Boolean)
          .addProp("myChoice", `${SERVICE_NAME}.Choice`, false)
          // .addProp("optionalChoice", `${SERVICE_NAME}.Choice`, true)
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
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV4.Boolean)
          .addProp("method", `${SERVICE_NAME}.PublishingMethod`, false)
          .addProp("altMethod", `${SERVICE_NAME}.PublishingMethod`, true)
          .addProp("altMethods", `Collection(${SERVICE_NAME}.PublishingMethod)`)
      )
      .addComplexType("PublishingMethod", undefined, (builder) =>
        builder.addProp("name", ODataTypesV4.Boolean).addProp("city", `${SERVICE_NAME}.City`)
      )
      .addComplexType("City", undefined, (builder) => {
        builder.addProp("choice", ODataTypesV4.Boolean, false).addProp("optChoice", ODataTypesV4.Boolean, true);
      });

    // when generating model
    // then match fixture text
    await generateAndCompare("entityComplex", "entity-complex.ts");
  });
}
