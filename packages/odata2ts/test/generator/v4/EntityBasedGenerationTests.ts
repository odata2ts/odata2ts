import { ODataTypesV4 } from "@odata2ts/odata-core";
import { beforeAll, beforeEach, test } from "vitest";
import { ConfigFileOptions, NamingStrategies } from "../../../src";
import { digest } from "../../../src/data-model/DataModelDigestionV4";
import { TypeModel } from "../../../src/TypeModel";
import { ODataModelBuilderV4 } from "../../data-model/builder/v4/ODataModelBuilderV4";
import {
  createHelper,
  EntityBasedGeneratorFunctionWithoutVersion,
  FixtureComparatorHelper,
} from "../comparator/FixtureComparatorHelper";
import { TestOptions } from "../TestTypes";

export const SERVICE_NAME = "Tester";
export const ENTITY_NAME = "Book";

const USE_ID_AND_EDITABLE_MODEL: ConfigFileOptions = {
  skipIdModels: false,
  skipEditableModels: false,
};

export function createEntityBasedGenerationTests(
  testSuiteName: string,
  fixtureBasePath: string,
  generatedFileName: string,
  generate: EntityBasedGeneratorFunctionWithoutVersion,
) {
  let odataBuilder: ODataModelBuilderV4;
  let fixtureComparatorHelper: FixtureComparatorHelper;

  function withNs(name: string) {
    return `${SERVICE_NAME}.${name}`;
  }

  beforeAll(async () => {
    fixtureComparatorHelper = await createHelper(fixtureBasePath, digest, generate);
  });

  beforeEach(() => {
    odataBuilder = new ODataModelBuilderV4(SERVICE_NAME);
  });

  async function generateAndCompare(id: string, fixturePath: string, genOptions?: TestOptions) {
    await fixtureComparatorHelper.generateAndCompare(
      generatedFileName,
      fixturePath,
      odataBuilder.getSchemas(),
      genOptions,
    );
  }

  test(`${testSuiteName}: one enum type`, async () => {
    // given only a single enum type
    odataBuilder
      .addEnumType("Choice", [
        { name: "A", value: 1 },
        { name: "B", value: 2 },
        { name: "Z", value: 99 },
      ])
      .addEnumType("EmptyEnum");

    // when generating model
    // then match fixture text
    await generateAndCompare("oneNumericEnumType", "enum-numeric-min.ts", { numericEnums: true });
  });

  test(`${testSuiteName}: complex type`, async () => {
    // given one minimal model
    odataBuilder.addComplexType("Brand", undefined, (builder) => builder.addProp("naming", ODataTypesV4.Boolean));

    // when generating model
    // then match fixture text
    await generateAndCompare("complexType", "complex-min.ts");
  });

  test(`${testSuiteName}: complex type with editable`, async () => {
    // given one minimal model
    odataBuilder
      .addComplexType("Brand", undefined, (builder) =>
        builder.addProp("naming", ODataTypesV4.Boolean).addProp("complex", withNs("Test")),
      )
      .addComplexType("Test", undefined, (builder) => builder.addProp("test", ODataTypesV4.Boolean));

    // when generating model
    // then match fixture text
    await generateAndCompare("complexTypeEdit", "complex-editable.ts", USE_ID_AND_EDITABLE_MODEL);
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
        .addKeyProp("id2", ODataTypesV4.Int32)
        .addKeyProp("id3", ODataTypesV4.Boolean)
        .addProp("requiredOption", ODataTypesV4.Boolean, false)
        .addProp("time", ODataTypesV4.TimeOfDay)
        .addProp("optionalDate", ODataTypesV4.Date)
        .addProp("dateTimeOffset", ODataTypesV4.DateTimeOffset)
        .addProp("TestDecimal", ODataTypesV4.Decimal)
        .addProp("testBinary", ODataTypesV4.Binary)
        .addProp("testAny", "Edm.AnythingYouWant")
        .addProp("multipleStrings", `Collection(${ODataTypesV4.String})`)
        .addProp("multipleNumbers", `Collection(${ODataTypesV4.Decimal})`)
        .addProp("multipleBooleans", `Collection(${ODataTypesV4.Boolean})`)
        .addProp("multipleIds", `Collection(${ODataTypesV4.Guid})`)
        .addProp("multipleTimes", `Collection(${ODataTypesV4.TimeOfDay})`)
        .addProp("multipleDates", `Collection(${ODataTypesV4.Date})`)
        .addProp("multipleDateTimeOffsets", `Collection(${ODataTypesV4.DateTimeOffset})`)
        .addProp("multipleBinaries", `Collection(${ODataTypesV4.Binary})`),
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("oneMaxModel", "entity-max.ts", {
      ...USE_ID_AND_EDITABLE_MODEL,
      propertiesByName: [
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
        builder.addKeyProp("id", ODataTypesV4.Int32).addProp("name", ODataTypesV4.Boolean, true),
      )
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV4.Int32)
          .addProp("author", withNs("Author"), false)
          .addProp("altAuthor", withNs("Author"), true)
          .addProp("relatedAuthors", `Collection(${withNs("Author")})`),
      );

    // when generating model
    // then match fixture text
    await generateAndCompare("entity-relationships", "entity-relationships.ts", {
      skipEditableModels: false,
      disableAutoManagedKey: true,
    });
  });

  test(`${testSuiteName}: multiple namespaces`, async () => {
    // given one minimal model
    odataBuilder
      .addEntityType("Author", undefined, (builder) =>
        builder.addKeyProp("id", ODataTypesV4.Int32).addProp("name", ODataTypesV4.Boolean, true),
      )
      .addSchema("myNamespace.Test")
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV4.Int32)
          .addProp("author", withNs("Author"), false)
          .addProp("altAuthor", withNs("Author"), true)
          .addProp("relatedAuthors", `Collection(${withNs("Author")})`),
      );

    // when generating model
    // then match fixture text
    await generateAndCompare("multiple-namespaces", "entity-relationships.ts", {
      skipEditableModels: false,
      disableAutoManagedKey: true,
    });
  });

  test(`${testSuiteName}: base class`, async () => {
    // given an entity hierarchy
    odataBuilder.addEntityType("GrandParent", undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.Boolean));
    odataBuilder.addEntityType("Parent", { baseType: withNs("GrandParent") }, (builder) =>
      builder.addProp("parentalAdvice", ODataTypesV4.Boolean),
    );
    odataBuilder.addEntityType("Child", { baseType: withNs("Parent") }, (builder) =>
      builder.addKeyProp("id2", ODataTypesV4.Boolean).addProp("Ch1ld1shF4n", ODataTypesV4.Boolean),
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("baseClass", "entity-hierarchy.ts", {
      ...USE_ID_AND_EDITABLE_MODEL,
      disableAutoManagedKey: true,
    });
  });

  test(`${testSuiteName}: base class from different namespace`, async () => {
    // given an entity hierarchy
    odataBuilder.addEntityType("GrandParent", undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.Boolean));
    odataBuilder.addEntityType("Parent", { baseType: withNs("GrandParent") }, (builder) =>
      builder.addProp("parentalAdvice", ODataTypesV4.Boolean),
    );
    odataBuilder.addSchema("myTest.test");
    odataBuilder.addEntityType("Child", { baseType: withNs("Parent") }, (builder) =>
      builder.addKeyProp("id2", ODataTypesV4.Boolean).addProp("Ch1ld1shF4n", ODataTypesV4.Boolean),
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("baseClassDifferentNS", "entity-hierarchy.ts", {
      ...USE_ID_AND_EDITABLE_MODEL,
      disableAutoManagedKey: true,
    });
  });

  test(`${testSuiteName}: entity & enum`, async () => {
    // given an entity with enum props
    odataBuilder
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV4.Boolean)
          .addProp("myChoice", withNs("Choice"), false)
          // .addProp("optionalChoice", withNs("Choice"), true)
          .addProp("otherChoices", `Collection(${withNs("Choice")})`),
      )
      .addEnumType("Choice", [
        { name: "A", value: 1 },
        { name: "B", value: 2 },
        { name: "Z", value: 99 },
      ]);

    // when generating model
    // then match fixture text
    await generateAndCompare("entityEnum", "entity-enum.ts");
    await generateAndCompare("entityEnumNumeric", "entity-enum-numeric.ts", { numericEnums: true });
  });

  test(`${testSuiteName}: entity & complex entity`, async () => {
    // given an entity with enum props
    odataBuilder
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV4.Boolean)
          .addProp("method", withNs("PublishingMethod"), false)
          .addProp("altMethod", withNs("PublishingMethod"), true)
          .addProp("altMethods", `Collection(${withNs("PublishingMethod")})`),
      )
      .addComplexType("PublishingMethod", undefined, (builder) =>
        builder.addProp("name", ODataTypesV4.Boolean).addProp("city", withNs("City")),
      )
      .addComplexType("City", undefined, (builder) => {
        builder.addProp("choice", ODataTypesV4.Boolean, false).addProp("optChoice", ODataTypesV4.Boolean, true);
      });

    // when generating model
    // then match fixture text
    await generateAndCompare("entityComplex", "entity-complex.ts");
  });

  test(`${testSuiteName}: empty function`, async () => {
    // given a simple function
    odataBuilder.addFunction("EmptyFunction", ODataTypesV4.String, false);

    // when generating model
    // then match fixture text
    await generateAndCompare("emptyFunction", "function-empty.ts");
  });

  test(`${testSuiteName}: empty action`, async () => {
    // given a simple function
    odataBuilder.addAction("EmptyAction", ODataTypesV4.String, false);

    // when generating model
    // then match fixture text
    await generateAndCompare("emptyAction", "action-empty.ts");
  });

  test(`${testSuiteName}: convert boolean to string`, async () => {
    // given a simple function
    odataBuilder.addEntityType(ENTITY_NAME, undefined, (builder) =>
      builder.addKeyProp("id", ODataTypesV4.Boolean).addProp("optional", ODataTypesV4.Boolean, true),
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("converter", "entity-converter.ts", { converters: ["@odata2ts/test-converters"] });
  });

  test(`${testSuiteName}: convert with 3-party model`, async () => {
    // given a simple function
    odataBuilder.addEntityType(ENTITY_NAME, undefined, (builder) =>
      builder.addKeyProp("id", ODataTypesV4.Boolean).addProp("optional", ODataTypesV4.String, true),
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("converter-with-model", "entity-converter-with-model.ts", {
      converters: [{ module: "@odata2ts/test-converters", use: ["stringToPrefixModelConverter"] }],
    });
  });

  test(`${testSuiteName}: model naming`, async () => {
    // given an entity with enum props
    odataBuilder
      .addEntityType("parent", undefined, (builder) => {
        return builder.addKeyProp("parentId", ODataTypesV4.Boolean);
      })
      .addEntityType(ENTITY_NAME, { baseType: withNs("parent") }, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV4.Boolean)
          .addProp("my_Choice", withNs("Choice"), false)
          .addProp("Address", withNs("LOCATION")),
      )
      .addEnumType("Choice", [
        { name: "A", value: 1 },
        { name: "B", value: 2 },
      ])
      .addComplexType("LOCATION", undefined, (builder) => builder.addProp("TEST", ODataTypesV4.Boolean));

    // when generating model
    // then match fixture text
    await generateAndCompare("modelNaming", "model-naming.ts", {
      skipEditableModels: false,
      skipIdModels: false,
      disableAutoManagedKey: true,
      naming: {
        models: {
          suffix: "model",
          namingStrategy: NamingStrategies.CONSTANT_CASE,
          propNamingStrategy: NamingStrategies.CONSTANT_CASE,
          idModels: {
            suffix: "Key",
            applyModelNaming: false,
          },
          editableModels: {
            prefix: "Edit",
          },
        },
        queryObjects: { prefix: "", suffix: "QObj", namingStrategy: NamingStrategies.CONSTANT_CASE },
      },
    });
  });

  test(`${testSuiteName}: model naming min`, async () => {
    // given an entity with enum props
    odataBuilder
      .addEntityType("parent", undefined, (builder) => {
        return builder.addKeyProp("parentId", ODataTypesV4.Boolean);
      })
      .addEntityType(ENTITY_NAME, { baseType: withNs("parent") }, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV4.Boolean)
          .addProp("my_Choice", withNs("Choice"), false)
          .addProp("Address", withNs("LOCATION")),
      )
      .addEnumType("Choice", [
        { name: "A", value: 1 },
        { name: "B", value: 2 },
      ])
      .addComplexType("LOCATION", undefined, (builder) => builder.addProp("TEST", ODataTypesV4.Boolean));

    // when generating model
    // then match fixture text
    await generateAndCompare("modelNamingMin", "model-naming-min.ts", {
      skipEditableModels: false,
      skipIdModels: false,
      disableAutoManagedKey: true,
      naming: {
        minimalDefaults: true,
      },
    });
  });

  test(`${testSuiteName}: entity & prop manipulation`, async () => {
    // given an entity with enum props
    odataBuilder
      .addEntityType("CATEGORY", undefined, (builder) => {
        return builder.addKeyProp("ID", ODataTypesV4.Boolean).addProp("version", ODataTypesV4.Int32);
      })
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder.addKeyProp("ID", ODataTypesV4.Boolean).addProp("address", withNs("LOCATION")),
      )
      .addComplexType("LOCATION", undefined, (builder) => builder.addProp("TEST", ODataTypesV4.Boolean));

    // when generating model
    // then match fixture text
    await generateAndCompare("entity-prop-manipulation", "entity-prop-manipulation.ts", {
      skipEditableModels: false,
      skipIdModels: false,
      disableAutoManagedKey: true,
      allowRenaming: false,
      propertiesByName: [{ name: "ID", mappedName: "id" }],
      byTypeAndName: [
        { type: TypeModel.EntityType, name: "CATEGORY", mappedName: "Category", keys: ["ID", "version"] },
        { type: TypeModel.EntityType, name: ENTITY_NAME, properties: [{ name: "ID", managed: true }] },
      ],
    });
  });

  test(`${testSuiteName}: big numbers as string in v4`, async () => {
    // given one max model
    odataBuilder.addEntityType(ENTITY_NAME, undefined, (builder) =>
      builder
        .addKeyProp("id", ODataTypesV4.Guid)
        .addProp("price", ODataTypesV4.Decimal, false)
        .addProp("charCount", ODataTypesV4.Int64),
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("big-number-v4", "entity-big-number-v4.ts", {
      v4BigNumberAsString: true,
    });
  });

  test(`${testSuiteName}: abstract entity & complex type`, async () => {
    odataBuilder
      .addEntityType(ENTITY_NAME, { abstract: true }, () => {})
      .addEntityType("ExtendsFromEntity", { baseType: withNs(ENTITY_NAME) }, (builder) => {
        return builder.addKeyProp("ID", ODataTypesV4.Boolean);
      })
      .addComplexType("Complex", { abstract: true }, () => {})
      .addComplexType("ExtendsFromComplex", { baseType: withNs("Complex") }, (builder) => {
        return builder.addProp("test", ODataTypesV4.Boolean);
      });

    // when generating model
    // then match fixture text
    await generateAndCompare("abstract", "abstract.ts", { skipIdModels: false, skipEditableModels: false });
  });

  test(`${testSuiteName}: abstract entity type with keys`, async () => {
    odataBuilder
      .addEntityType(ENTITY_NAME, { abstract: true }, (builder) => {
        return builder.addKeyProp("ID", ODataTypesV4.Boolean).addProp("test", ODataTypesV4.Boolean);
      })
      .addEntityType("NothingToAdd", { baseType: withNs(ENTITY_NAME) }, () => {})
      .addEntityType("WithOwnStuff", { baseType: withNs(ENTITY_NAME) }, (builder) => {
        return builder.addKeyProp("ID2", ODataTypesV4.Boolean).addProp("test2", ODataTypesV4.Boolean);
      });

    // when generating model
    // then match fixture text
    await generateAndCompare("abstract-with-prop-inheritance", "abstract-with-inheritance.ts", {
      skipIdModels: false,
      skipEditableModels: false,
    });
  });
}
