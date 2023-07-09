import { ODataTypesV2 } from "@odata2ts/odata-core";

import { digest } from "../../../src/data-model/DataModelDigestionV2";
import { ODataModelBuilderV2 } from "../../data-model/builder/v2/ODataModelBuilderV2";
import {
  EntityBasedGeneratorFunctionWithoutVersion,
  FixtureComparatorHelper,
  createHelper,
} from "../comparator/FixtureComparatorHelper";
import { TestOptions } from "../TestTypes";

export const SERVICE_NAME = "Tester";
export const ENTITY_NAME = "Book";

export function createEntityBasedGenerationTests(
  testSuiteName: string,
  fixtureBasePath: string,
  generate: EntityBasedGeneratorFunctionWithoutVersion
) {
  let odataBuilder: ODataModelBuilderV2;
  let fixtureComparatorHelper: FixtureComparatorHelper;

  async function generateAndCompare(id: string, fixturePath: string, options?: TestOptions) {
    await fixtureComparatorHelper.generateAndCompare(id, fixturePath, odataBuilder.getSchemas(), options);
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
    odataBuilder.addComplexType("Brand", undefined, (builder) => builder.addProp("naming", ODataTypesV2.Boolean));

    // when generating model
    // then match fixture text
    await generateAndCompare("complexType", "complex-min.ts");
  });

  test(`${testSuiteName}: complex type with editable`, async () => {
    // given one minimal model
    odataBuilder
      .addComplexType("Brand", undefined, (builder) =>
        builder.addProp("naming", ODataTypesV2.Boolean).addProp("complex", SERVICE_NAME + ".Test")
      )
      .addComplexType("Test", undefined, (builder) => builder.addProp("test", ODataTypesV2.Boolean));

    // when generating model
    // then match fixture text
    await generateAndCompare("complexTypeEdit", "complex-editable.ts", {
      skipIdModels: false,
      skipEditableModels: false,
    });
  });

  test(`${testSuiteName}: one minimal model`, async () => {
    // given one minimal model
    odataBuilder.addEntityType(ENTITY_NAME, undefined, (builder) => builder.addKeyProp("id", ODataTypesV2.Boolean));

    // when generating model
    // then match fixture text
    await generateAndCompare("oneModel", "entity-min.ts");
  });

  test(`${testSuiteName}: one max model`, async () => {
    // given one minimal model
    odataBuilder.addEntityType(ENTITY_NAME, undefined, (builder) =>
      builder
        .addKeyProp("id", ODataTypesV2.Guid)
        .addKeyProp("id2", ODataTypesV2.Int32)
        .addKeyProp("id3", ODataTypesV2.Boolean)
        .addProp("requiredOption", ODataTypesV2.Boolean, false)
        .addProp("time", ODataTypesV2.Time)
        .addProp("optionalDate", ODataTypesV2.DateTime)
        .addProp("dateTimeOffset", ODataTypesV2.DateTimeOffset)
        .addProp("testByte", ODataTypesV2.Byte)
        .addProp("testSByte", ODataTypesV2.SByte)
        .addProp("testInt16", ODataTypesV2.Int16)
        .addProp("testInt32", ODataTypesV2.Int32)
        .addProp("testInt64", ODataTypesV2.Int64)
        .addProp("testSingle", ODataTypesV2.Single)
        .addProp("testDouble", ODataTypesV2.Double)
        .addProp("TestDecimal", ODataTypesV2.Decimal)
        .addProp("testBinary", ODataTypesV2.Binary)
        .addProp("testAny", "Edm.AnythingYouWant")
        .addProp("multipleIds", `Collection(${ODataTypesV2.Guid})`)
        .addProp("multipleStrings", `Collection(${ODataTypesV2.String})`)
        .addProp("multipleBooleans", `Collection(${ODataTypesV2.Boolean})`)
        .addProp("multipleTimes", `Collection(${ODataTypesV2.Time})`)
        .addProp("multipleDateTimes", `Collection(${ODataTypesV2.DateTime})`)
        .addProp("multipleDateTimeOffsets", `Collection(${ODataTypesV2.DateTimeOffset})`)
        .addProp("multipleInt16", `Collection(${ODataTypesV2.Int16})`)
        .addProp("multipleDecimals", `Collection(${ODataTypesV2.Decimal})`)
        .addProp("multipleBinaries", `Collection(${ODataTypesV2.Binary})`)
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("oneMaxModel", "entity-max-v2.ts", {
      skipIdModels: false,
      skipEditableModels: false,
      propertiesByName: [
        // EditableModel will not have managed props
        ...["id", "id2", "multipleIds"].map((name) => ({ name, managed: true })),
        {
          name: "requiredOption",
          mappedName: "truth",
          // converters: [{ module: "@odata2ts/test-converter", use: ["booleanToNumberConverter"] }],
        },
      ],
    });
  });

  test(`${testSuiteName}: entity relationships`, async () => {
    // given one minimal model
    odataBuilder
      .addEntityType("Author", undefined, (builder) =>
        builder.addKeyProp("id", ODataTypesV2.Int32).addProp("name", ODataTypesV2.Boolean, true)
      )
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV2.Int32)
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
      .addEntityType("GrandParent", undefined, (builder) => builder.addKeyProp("id", ODataTypesV2.Boolean))
      .addEntityType("Parent", "GrandParent", (builder) => builder.addProp("parentalAdvice", ODataTypesV2.Boolean))
      .addEntityType("Child", "Parent", (builder) =>
        builder.addKeyProp("id2", ODataTypesV2.Boolean).addProp("Ch1ld1shF4n", ODataTypesV2.Boolean)
      );

    // when generating model
    // then match fixture text
    await generateAndCompare("baseClass", "entity-hierarchy.ts", {
      skipIdModels: false,
      skipEditableModels: false,
      disableAutoManagedKey: true,
    });
  });

  test(`${testSuiteName}: entity & enum`, async () => {
    // given an entity with enum props
    odataBuilder
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV2.Boolean)
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
          .addKeyProp("id", ODataTypesV2.Boolean)
          .addProp("method", `${SERVICE_NAME}.PublishingMethod`, false)
          .addProp("altMethod", `${SERVICE_NAME}.PublishingMethod`, true)
          .addProp("altMethods", `Collection(${SERVICE_NAME}.PublishingMethod)`)
      )
      .addComplexType("PublishingMethod", undefined, (builder) =>
        builder.addProp("name", ODataTypesV2.Boolean).addProp("city", `${SERVICE_NAME}.City`)
      )
      .addComplexType("City", undefined, (builder) => {
        builder.addProp("choice", ODataTypesV2.Boolean, false).addProp("optChoice", ODataTypesV2.Boolean);
      });

    // when generating model
    // then match fixture text
    await generateAndCompare("entityComplex", "entity-complex.ts");
  });

  test(`${testSuiteName}: convert boolean to string`, async () => {
    // given a simple function
    odataBuilder.addEntityType(ENTITY_NAME, undefined, (builder) =>
      builder.addKeyProp("id", ODataTypesV2.Boolean).addProp("optional", ODataTypesV2.Boolean, true)
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("entityConverter", "entity-converter.ts", { converters: ["@odata2ts/test-converters"] });
  });
}
