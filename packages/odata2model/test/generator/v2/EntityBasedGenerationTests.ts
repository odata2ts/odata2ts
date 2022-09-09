import { digest } from "../../../src/data-model/DataModelDigestionV2";
import { ODataTypesV3 } from "../../../src/data-model/edmx/ODataEdmxModelV3";
import { GenerationOptions } from "../../../src/OptionModel";
import { ODataModelBuilderV2 } from "../../data-model/builder/v2/ODataModelBuilderV2";
import {
  EntityBasedGeneratorFunctionWithoutVersion,
  FixtureComparatorHelper,
  createHelper,
} from "../comparator/FixtureComparatorHelper";

export const SERVICE_NAME = "Tester";
export const ENTITY_NAME = "Book";

export function createEntityBasedGenerationTests(
  testSuiteName: string,
  fixtureBasePath: string,
  generate: EntityBasedGeneratorFunctionWithoutVersion
) {
  let odataBuilder: ODataModelBuilderV2;
  let fixtureComparatorHelper: FixtureComparatorHelper;

  async function generateAndCompare(id: string, fixturePath: string, genOptions?: GenerationOptions) {
    await fixtureComparatorHelper.generateAndCompare(id, fixturePath, odataBuilder.getSchema(), genOptions);
  }

  beforeAll(async () => {
    fixtureComparatorHelper = await createHelper(fixtureBasePath, digest, generate);
  });

  beforeEach(() => {
    odataBuilder = new ODataModelBuilderV2(SERVICE_NAME);
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

  test(`${testSuiteName}: complex type with editable`, async () => {
    // given one minimal model
    odataBuilder.addComplexType("Brand", undefined, (builder) => builder.addProp("naming", ODataTypesV3.Boolean));

    // when generating model
    // then match fixture text
    await generateAndCompare("complexTypeEdit", "complex-editable.ts", {
      skipIdModel: false,
      skipEditableModel: false,
    });
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
        .addKeyProp("id2", ODataTypesV3.Int32)
        .addKeyProp("id3", ODataTypesV3.Boolean)
        .addProp("requiredOption", ODataTypesV3.Boolean, false)
        .addProp("time", ODataTypesV3.Time)
        .addProp("optionalDate", ODataTypesV3.DateTime)
        .addProp("dateTimeOffset", ODataTypesV3.DateTimeOffset)
        .addProp("testByte", ODataTypesV3.Byte)
        .addProp("testSByte", ODataTypesV3.SByte)
        .addProp("testInt16", ODataTypesV3.Int16)
        .addProp("testInt32", ODataTypesV3.Int32)
        .addProp("testInt64", ODataTypesV3.Int64)
        .addProp("testSingle", ODataTypesV3.Single)
        .addProp("testDouble", ODataTypesV3.Double)
        .addProp("TestDecimal", ODataTypesV3.Decimal)
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
    await generateAndCompare("oneMaxModel", "entity-max-v2.ts", { skipIdModel: false, skipEditableModel: false });
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
    odataBuilder
      .addEntityType("GrandParent", undefined, (builder) => builder.addKeyProp("id", ODataTypesV3.Boolean))
      .addEntityType("Parent", "GrandParent", (builder) => builder.addProp("parentalAdvice", ODataTypesV3.Boolean))
      .addEntityType("Child", "Parent", (builder) =>
        builder.addKeyProp("id2", ODataTypesV3.Boolean).addProp("Ch1ld1shF4n", ODataTypesV3.Boolean)
      );

    // when generating model
    // then match fixture text
    await generateAndCompare("baseClass", "entity-hierarchy.ts", { skipIdModel: false, skipEditableModel: false });
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
