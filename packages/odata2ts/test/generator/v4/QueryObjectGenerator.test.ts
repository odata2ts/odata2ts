import { ODataTypesV4, ODataVersions } from "@odata2ts/odata-core";
import { beforeAll, beforeEach, describe, test } from "vitest";
import { digest } from "../../../src/data-model/DataModelDigestionV4.js";
import { generateQueryObjects } from "../../../src/generator/index.js";
import { EmitModes, EnumSynthesis } from "../../../src/index.js";
import { createProjectManager } from "../../../src/project/ProjectManager.js";
import { allowedValues, alternateKeys } from "../../data-model/builder/ODataAnnotationBuilder.js";
import { ODataModelBuilderV4 } from "../../data-model/builder/v4/ODataModelBuilderV4.js";
import {
  createHelper,
  EntityBasedGeneratorFunctionWithoutVersion,
  FixtureComparatorHelper,
} from "../comparator/FixtureComparatorHelper.js";
import { TestOptions } from "../TestTypes.js";
import { createEntityBasedGenerationTests, ENTITY_NAME, SERVICE_NAME } from "./EntityBasedGenerationTests.js";

describe("Query Object Generator Tests V4", () => {
  const TEST_SUITE_NAME = "Query Object Generator";
  const FIXTURE_BASE_PATH = "generator/qobject";
  const MODEL_FILE = "QTester";

  const GENERATE: EntityBasedGeneratorFunctionWithoutVersion = async (dataModel, options, namingHelper) => {
    const projectManager = await createProjectManager("build/unitTest", EmitModes.ts, namingHelper, dataModel, {
      noOutput: true,
      bundledFileGeneration: options.bundledFileGeneration ?? true,
      allowTypeChecking: true,
    });
    await generateQueryObjects(projectManager, dataModel, ODataVersions.V4, options, namingHelper);
    return projectManager;
  };

  let odataBuilder: ODataModelBuilderV4;
  let fixtureComparatorHelper: FixtureComparatorHelper;

  function withNs(name: string) {
    return `${SERVICE_NAME}.${name}`;
  }

  createEntityBasedGenerationTests(TEST_SUITE_NAME, FIXTURE_BASE_PATH, MODEL_FILE, GENERATE);

  async function generateAndCompare(fixturePath: string, genOptions?: TestOptions, fileToInspect = MODEL_FILE) {
    await fixtureComparatorHelper.generateAndCompare(fileToInspect, fixturePath, odataBuilder.getSchemas(), genOptions);
  }

  beforeAll(async () => {
    fixtureComparatorHelper = await createHelper(FIXTURE_BASE_PATH, digest, GENERATE);
  });

  beforeEach(() => {
    odataBuilder = new ODataModelBuilderV4(SERVICE_NAME);
  });

  test(`${TEST_SUITE_NAME}: an aliased alternate key adds an overloaded param set to QId`, async () => {
    odataBuilder.enableAnnotations().addEntityType(ENTITY_NAME, undefined, (builder) =>
      builder
        .addKeyProp("id", ODataTypesV4.Guid)
        .addProp("isbn", ODataTypesV4.String, false)
        .addTypeAnnotations([alternateKeys([[{ name: "isbn", alias: "ISBN" }]], { fullyQualified: true })]),
    );

    await generateAndCompare("entity-alternate-key.ts", { skipIdModels: false });
  });

  test(`${TEST_SUITE_NAME}: flags enum offers has, the collection of it does not`, async () => {
    /*
     * `IsFlags="true"` is the one thing in an `<EnumType>` that reaches the generated code: it decides
     * which path the property gets, and only that path offers `has`. A collection keeps the plain path,
     * since `has` applies to the property rather than to its items.
     */
    odataBuilder
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV4.Guid)
          .addProp("amenities", withNs("Amenities"))
          .addProp("otherAmenities", `Collection(${withNs("Amenities")})`),
      )
      .addEnumType(
        "Amenities",
        [
          { name: "Parking", value: 1 },
          { name: "Cafe", value: 2 },
        ],
        true,
      );

    await generateAndCompare("entity-enum-flags.ts");
  });

  test(`${TEST_SUITE_NAME}: enums derived from allowed values`, async () => {
    /*
     * An enum the service never declared takes the same path as a declared one, but with the converter the
     * model generator emits next to it: what goes into the URL is the value behind a member, not its name.
     * That holds whatever `enumType` says - the numeric variants transmit names and are therefore no
     * option here.
     */
    /*
     * Rebuilt for each variant: the digester derives the enum by rewriting the metadata, exactly as it
     * unflattens complex types, so a model that has been through it once already carries the result.
     */
    const buildModel = () => {
      odataBuilder = new ODataModelBuilderV4(SERVICE_NAME);
      odataBuilder.addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV4.Guid)
          .addProp("status", ODataTypesV4.Byte, false)
          .addPropAnnotations("status", [
            allowedValues(
              [
                { name: "Available", value: 0 },
                { name: "OnLoan", value: 1 },
                { name: "Missing", value: 2 },
              ],
              { fullyQualified: true },
            ),
          ]),
      );
    };

    buildModel();
    await generateAndCompare("entity-enum-allowed-values.ts", {
      enumSynthesized: EnumSynthesis.allowedValuesAndSymbolicName,
    });
    buildModel();
    await generateAndCompare("entity-enum-allowed-values-numeric.ts", {
      enumSynthesized: EnumSynthesis.allowedValuesAndSymbolicName,
      enumType: "numeric",
    });
  });

  test(`QFunction: min`, async () => {
    // given a simple function
    odataBuilder.addFunction("MinFunction", ODataTypesV4.String, false);

    // when generating model
    // then match fixture text
    await generateAndCompare("function-min.ts");
  });

  test(`QFunction: max params`, async () => {
    odataBuilder
      .addComplexType("Complex", undefined, (builder) => builder.addProp("a", ODataTypesV4.String))
      .addEntityType("TheEntity", undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.String))
      .addEnumType("TheEnum", [{ name: "One", value: 1 }])
      .addFunction("MAX_FUNCTION", ODataTypesV4.Boolean, false, (builder) =>
        builder
          .addParam("TEST_STRING", ODataTypesV4.String, false)
          .addParam("testNumber", ODataTypesV4.Int32, false)
          .addParam("testBoolean", ODataTypesV4.Boolean, false)
          .addParam("testGuid", ODataTypesV4.Guid, false)
          .addParam("testTime", ODataTypesV4.TimeOfDay, false)
          .addParam("testDate", ODataTypesV4.Date, false)
          .addParam("testDateTimeOffset", ODataTypesV4.DateTimeOffset, false)
          .addParam("testDateTimeOffset", ODataTypesV4.DateTimeOffset, false)
          .addParam("complex", `${withNs("Complex")}`)
          .addParam("ENTITY", `${withNs("TheEntity")}`)
          .addParam("enum", `${withNs("TheEnum")}`),
      );

    await generateAndCompare("function-max.ts");
  });

  test("QFunction: Max params converted", async () => {
    odataBuilder
      .addComplexType("Complex", undefined, (builder) => builder.addProp("a", ODataTypesV4.String))
      .addEntityType("TheEntity", undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.String))
      .addEnumType("TheEnum", [{ name: "One", value: 1 }])
      .addFunction("MAX_FUNCTION", ODataTypesV4.Boolean, false, (builder) =>
        builder
          .addParam("TEST_STRING", ODataTypesV4.String, false)
          .addParam("testNumber", ODataTypesV4.Int32, false)
          .addParam("testBoolean", ODataTypesV4.Boolean, false)
          .addParam("testGuid", ODataTypesV4.Guid, false)
          .addParam("testTime", ODataTypesV4.TimeOfDay, false)
          .addParam("testDate", ODataTypesV4.Date, false)
          .addParam("testDateTimeOffset", ODataTypesV4.DateTimeOffset, false)
          .addParam("testDateTimeOffset", ODataTypesV4.DateTimeOffset, false)
          .addParam("complex", `${withNs("Complex")}`)
          .addParam("ENTITY", `${withNs("TheEntity")}`)
          .addParam("enum", `${withNs("TheEnum")}`),
      );

    await generateAndCompare("function-max-converted.ts", {
      converters: [{ module: "@odata2ts/test-converters" }],
    });
  });

  test(`QFunction: bound`, async () => {
    odataBuilder
      .addEntityType(ENTITY_NAME, undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.Boolean))
      .addFunction("MinFunction", ODataTypesV4.Boolean, true, (builder) =>
        builder
          .addParam("book", `${withNs("Book")}`)
          .addParam("test", ODataTypesV4.String, false)
          .addParam("optTest", ODataTypesV4.Boolean, true),
      );

    await generateAndCompare("function-bound.ts");
  });

  test(`QFunction: collection bound`, async () => {
    odataBuilder
      .addEntityType(ENTITY_NAME, undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.Boolean))
      .addFunction("MinFunction", ODataTypesV4.Boolean, true, (builder) =>
        builder
          .addParam("_it", `Collection(${withNs("Book")})`)
          .addParam("test", ODataTypesV4.String, false)
          .addParam("optTest", ODataTypesV4.Boolean, true),
      );

    await generateAndCompare("function-bound-collection.ts");
  });

  test("QFunction: primitive collection response", async () => {
    odataBuilder.addFunction("TestFunction", `Collection(${ODataTypesV4.String})`, false);

    await generateAndCompare("function-rt-collection.ts");
  });

  test(`QFunction: overloaded params`, async () => {
    const funcName = "OverloadedFunction";
    odataBuilder
      .addFunction(funcName, ODataTypesV4.String, false, (builder) =>
        builder.addParam("test", ODataTypesV4.String, false).addParam("optTest", ODataTypesV4.String, true),
      )
      .addFunction(funcName, ODataTypesV4.String, false, (builder) => {
        builder.addParam("id", ODataTypesV4.Guid);
      });

    await generateAndCompare("function-overloaded.ts");
  });

  test(`QFunction: overloaded params 2`, async () => {
    const funcName = "OverloadedFunction";
    odataBuilder
      .addFunction(funcName, ODataTypesV4.String, false)
      .addFunction(funcName, ODataTypesV4.String, false, (builder) => {
        builder.addParam("test", ODataTypesV4.String, false);
      });

    await generateAndCompare("function-overloaded-2.ts");
  });

  test(`QAction: no response`, async () => {
    odataBuilder.addAction("TestAction", undefined, false, (builder) =>
      builder.addParam("test", ODataTypesV4.String, false).addParam("opt_Test", ODataTypesV4.String, true),
    );

    await generateAndCompare("action-no-response.ts");
  });

  test(`QAction: response types`, async () => {
    odataBuilder
      .addEntityType("Person", undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.String))
      .addAction("APrimitive", ODataTypesV4.Boolean, false)
      .addAction("APrimitiveCollection", `Collection(${ODataTypesV4.Boolean})`, false)
      .addAction("AModel", `${withNs("Person")}`, false)
      .addAction("AModelCollection", `Collection(${withNs("Person")})`, false);

    await generateAndCompare("action-response-types.ts");
  });

  test(`QAction: bound`, async () => {
    odataBuilder
      .addEntityType(ENTITY_NAME, undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.Boolean))
      .addAction("BoundAction", ODataTypesV4.Boolean, true, (builder) =>
        builder
          .addParam("test", `${SERVICE_NAME}.${ENTITY_NAME}`, false)
          .addParam("opt_Test", ODataTypesV4.String, true),
      );

    await generateAndCompare("action-bound.ts");
  });

  test(`QObject generation with nativeIn option`, async () => {
    // given a model with simple properties and collections
    // only simple properties should be generated with nativeIn option
    odataBuilder.addEntityType(ENTITY_NAME, undefined, (builder) =>
      builder
        .addKeyProp("id", ODataTypesV4.Int32)
        .addProp("testBoolean", ODataTypesV4.Boolean, false)
        .addProp("testTime", ODataTypesV4.TimeOfDay)
        .addProp("testDate", ODataTypesV4.Date)
        .addProp("testDateTimeOffset", ODataTypesV4.DateTimeOffset)
        .addProp("testString", ODataTypesV4.String)
        .addProp("testAny", "Edm.AnythingYouWant")
        .addProp("multipleIds", `Collection(${ODataTypesV4.Guid})`)
        .addProp("multipleStrings", `Collection(${ODataTypesV4.String})`),
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("entity-with-native-in.ts", {
      v4: { enableNativeInOperator: true },
    });
  });

  test(`QObject generation with nativeIn option and unbundled mode`, async () => {
    // given a model with simple properties and collections
    // only simple properties should be generated with nativeIn option
    odataBuilder.addEntityType(ENTITY_NAME, undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.Int32));

    // when generating model
    // then match fixture text of main qobject
    await generateAndCompare("unbundled-main-native-in.ts", {
      v4: { enableNativeInOperator: true },
      bundledFileGeneration: false,
    });
    // when generating model
    // then match fixture text of unbundled file
    await generateAndCompare(
      "unbundled-file-native-in.ts",
      {
        v4: { enableNativeInOperator: true },
        bundledFileGeneration: false,
      },
      `${SERVICE_NAME.toLowerCase()}/${ENTITY_NAME.toLowerCase()}/Q${ENTITY_NAME}`,
    );
  });

  function addRelatedEntities() {
    odataBuilder
      .addEntityType("Author", undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.Int32))
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV4.Int32)
          .addProp("author", withNs("Author"), false)
          .addProp("relatedAuthors", `Collection(${withNs("Author")})`),
      );
  }

  test(`${TEST_SUITE_NAME}: binding of a navigation property`, async () => {
    // given entities related to each other, reachable through entity sets
    addRelatedEntities();
    odataBuilder.addEntitySet("Authors", withNs("Author")).addEntitySet("Books", withNs(ENTITY_NAME), [
      { path: "author", target: "Authors" },
      { path: "relatedAuthors", target: "Authors" },
    ]);

    // when opting into the binding props
    // then the q-paths carry the id function of the entity set they point to, which is what turns the
    // key stated in an editable model into the URL of the referenced entity
    await generateAndCompare("entity-binding.ts", {
      skipIdModels: false,
    });
  });

  test(`${TEST_SUITE_NAME}: no binding without a NavigationPropertyBinding`, async () => {
    // given entities related to each other, but no entity set stating where the navigation leads
    addRelatedEntities();

    // when opting into the binding props
    // then the q-paths stay as they are: the URL of the referenced entity could not be built
    await generateAndCompare("entity-binding-unbound.ts", {
      skipIdModels: false,
    });
  });

  test(`${TEST_SUITE_NAME}: stream property gets no q-path`, async () => {
    // given an entity with a stream property
    odataBuilder.addEntityType("Audiobook", undefined, (builder) =>
      builder
        .addKeyProp("id", ODataTypesV4.Guid)
        .addProp("title", ODataTypesV4.String, false)
        .addProp("Sample", ODataTypesV4.Stream),
    );

    // when generating q-objects
    // then `Sample` has no q-path: filtering and ordering do not apply to binary content, and the
    // q-object converts a payload the stream is not part of
    await generateAndCompare("entity-stream-property.ts");
  });
});
