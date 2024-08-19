import { ODataTypesV4, ODataVersions } from "@odata2ts/odata-core";
import { beforeAll, beforeEach, describe, test } from "vitest";
import { EmitModes } from "../../../src";
import { digest } from "../../../src/data-model/DataModelDigestionV4";
import { DigestionOptions } from "../../../src/FactoryFunctionModel";
import { generateModels } from "../../../src/generator";
import { createProjectManager } from "../../../src/project/ProjectManager";
import { ODataModelBuilderV4 } from "../../data-model/builder/v4/ODataModelBuilderV4";
import {
  createHelper,
  EntityBasedGeneratorFunctionWithoutVersion,
  FixtureComparatorHelper,
} from "../comparator/FixtureComparatorHelper";
import { createEntityBasedGenerationTests, ENTITY_NAME, SERVICE_NAME } from "./EntityBasedGenerationTests";

describe("Model Generator Tests V4", () => {
  const TEST_SUITE_NAME = "Model Generator";
  const FIXTURE_BASE_PATH = "generator/model";
  const MODEL_FILE = "TesterModel";

  const GENERATE: EntityBasedGeneratorFunctionWithoutVersion = async (dataModel, genOptions, namingHelper) => {
    const projectManager = await createProjectManager("build/unitTest", EmitModes.ts, namingHelper, dataModel, {
      noOutput: true,
      bundledFileGeneration: true,
      allowTypeChecking: true,
    });
    await generateModels(projectManager, dataModel, ODataVersions.V4, genOptions, namingHelper);
    return projectManager;
  };

  let odataBuilder: ODataModelBuilderV4;
  let fixtureComparatorHelper: FixtureComparatorHelper;

  function withNs(name: string) {
    return `${SERVICE_NAME}.${name}`;
  }

  createEntityBasedGenerationTests(TEST_SUITE_NAME, FIXTURE_BASE_PATH, MODEL_FILE, GENERATE);

  async function generateAndCompare(id: string, fixturePath: string, genOptions?: Partial<DigestionOptions>) {
    await fixtureComparatorHelper.generateAndCompare(MODEL_FILE, fixturePath, odataBuilder.getSchemas(), genOptions);
  }

  beforeAll(async () => {
    fixtureComparatorHelper = await createHelper(FIXTURE_BASE_PATH, digest, GENERATE);
  });

  beforeEach(() => {
    odataBuilder = new ODataModelBuilderV4(SERVICE_NAME);
  });

  test(`${TEST_SUITE_NAME}: min function param model`, async () => {
    // given a simple function
    odataBuilder.addFunction("MinOperation", ODataTypesV4.String, false, (builder) =>
      builder.addParam("test", ODataTypesV4.String, false).addParam("optTest", ODataTypesV4.String, true),
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("minFunction", "operation-min.ts");
  });

  test(`${TEST_SUITE_NAME}: min action param model`, async () => {
    // given a simple action
    // @note: return type doesn't affect param model
    odataBuilder.addAction("MinOperation", ODataTypesV4.Guid, false, (builder) =>
      builder.addParam("test", ODataTypesV4.String, false).addParam("optTest", ODataTypesV4.String, true),
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("minAction", "operation-min.ts");
  });

  test(`${TEST_SUITE_NAME}: max function param model`, async () => {
    // given a function
    odataBuilder.addFunction("maxOperation", ODataTypesV4.String, false, (builder) =>
      builder
        .addParam("test", ODataTypesV4.String, false)
        .addParam("testNumber", ODataTypesV4.Int32, false)
        .addParam("testBoolean", ODataTypesV4.Boolean, false)
        .addParam("testGuid", ODataTypesV4.Guid, false)
        .addParam("testTime", ODataTypesV4.TimeOfDay, false)
        .addParam("testDateOrDateTime", ODataTypesV4.Date, false)
        .addParam("testDateTimeOffset", ODataTypesV4.DateTimeOffset, false),
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("maxFunction", "operation-max.ts");
  });

  test(`${TEST_SUITE_NAME}: max action param model`, async () => {
    // given an action
    odataBuilder.addAction("maxOperation", ODataTypesV4.String, false, (builder) =>
      builder
        .addParam("test", ODataTypesV4.String, false)
        .addParam("testNumber", ODataTypesV4.Int32, false)
        .addParam("testBoolean", ODataTypesV4.Boolean, false)
        .addParam("testGuid", ODataTypesV4.Guid, false)
        .addParam("testTime", ODataTypesV4.TimeOfDay, false)
        .addParam("testDateOrDateTime", ODataTypesV4.Date, false)
        .addParam("testDateTimeOffset", ODataTypesV4.DateTimeOffset, false),
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("maxAction", "operation-max.ts");
  });

  test(`${TEST_SUITE_NAME}: bound function`, async () => {
    // given one minimal model with bound function
    odataBuilder
      .addEntityType(ENTITY_NAME, undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.Boolean))
      .addFunction("MinOperation", ODataTypesV4.String, true, (builder) =>
        builder
          .addParam("book", `${withNs("Book")}`)
          .addParam("test", ODataTypesV4.String, false)
          .addParam("optTest", ODataTypesV4.String, true),
      );

    // when generating model
    // then match fixture text
    await generateAndCompare("boundFunction", "operation-bound.ts");
  });

  test(`${TEST_SUITE_NAME}: collection bound function`, async () => {
    // given one minimal model with bound function
    odataBuilder
      .addEntityType(ENTITY_NAME, undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.Boolean))
      .addFunction("MinOperation", ODataTypesV4.String, true, (builder) =>
        builder
          .addParam("book", `Collection(${withNs("Book")})`)
          .addParam("test", ODataTypesV4.String, false)
          .addParam("optTest", ODataTypesV4.String, true),
      );

    // when generating model
    // then match fixture text => actually there's no diff in the generated param models between bound-to-entity and bound-to-collection
    await generateAndCompare("collBoundFunction", "operation-bound.ts");
  });

  test(`${TEST_SUITE_NAME}: no extra results wrapping`, async () => {
    // given one minimal model
    // given one minimal model
    odataBuilder
      .addEntityType("Author", undefined, (builder) =>
        builder.addKeyProp("id", ODataTypesV4.Int32).addProp("name", ODataTypesV4.Boolean, true),
      )
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV4.Int32)
          .addProp("author", `${withNs("Author")}`, false)
          .addProp("altAuthor", `${withNs("Author")}`, true)
          .addProp("relatedAuthors", `Collection(${withNs("Author")})`),
      );

    // when generating model
    // then match original fixture => config option has no effect
    await generateAndCompare("no-extra-results-wrapping", "entity-relationships.ts", {
      v2ModelsWithExtraResultsWrapping: true,
      skipEditableModels: false,
      disableAutoManagedKey: true,
    });
  });

  test(`${TEST_SUITE_NAME}: model with comments`, async () => {
    // given one max model
    odataBuilder.addEntityType(ENTITY_NAME, undefined, (builder) =>
      builder
        .addKeyProp("id", ODataTypesV4.Guid)
        .addProp("truth", ODataTypesV4.Boolean, false)
        .addProp("time", ODataTypesV4.TimeOfDay)
        .addProp("multipleStrings", `Collection(${ODataTypesV4.String})`),
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("commentedModel", "entity-with-comments.ts", {
      skipComments: false,
      converters: [{ module: "@odata2ts/test-converters", use: ["booleanToNumberConverter"] }],
      propertiesByName: [...["id"].map((name) => ({ name, managed: true }))],
    });
  });

  test(`${TEST_SUITE_NAME}: overloaded function params`, async () => {
    const testFunc = "testFunc";

    // given two functions with same name but different set of parameters
    odataBuilder
      .addFunction(testFunc, ODataTypesV4.String, false, (pBuilder) =>
        pBuilder.addParam("anyParam", ODataTypesV4.Boolean, false),
      )
      .addFunction(testFunc, ODataTypesV4.String, false);

    // when generating parameter model
    // then match fixture text
    await generateAndCompare("funcOverload", "function-overload.ts");
  });

  test(`${TEST_SUITE_NAME}: overloaded function params (changed order)`, async () => {
    const testFunc = "testFunc";

    // given two functions with same name but different set of parameters
    odataBuilder
      .addFunction(testFunc, ODataTypesV4.String, false)
      .addFunction(testFunc, ODataTypesV4.String, false, (pBuilder) =>
        pBuilder.addParam("anyParam", ODataTypesV4.Boolean, false),
      );

    // when generating parameter model
    // then match fixture text
    await generateAndCompare("funcOverload2", "function-overload.ts");
  });

  test(`${TEST_SUITE_NAME}: overloaded function params (multiple sets)`, async () => {
    const testFunc = "testFunc";

    // given two functions with same name but different set of parameters
    odataBuilder
      .addFunction(testFunc, ODataTypesV4.String, false, (pBuilder) => {
        pBuilder.addParam("myParam", ODataTypesV4.String, false);
      })
      .addFunction(testFunc, ODataTypesV4.String, false, (pBuilder) =>
        pBuilder.addParam("anyParam", ODataTypesV4.Boolean, false),
      )
      .addFunction(testFunc, ODataTypesV4.String, false, (pBuilder) =>
        pBuilder.addParam("x", ODataTypesV4.Int32, false).addParam("y", ODataTypesV4.Int32, true),
      );

    // when generating parameter model
    // then match fixture text
    await generateAndCompare("funcOverload3", "function-overload-multiple.ts", {});
  });
});
