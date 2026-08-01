import { ODataTypesV4, ODataVersions } from "@odata2ts/odata-core";
import { beforeAll, beforeEach, describe, test } from "vitest";
import { digest } from "../../../src/data-model/DataModelDigestionV4.js";
import { generateModels } from "../../../src/generator/index.js";
import { EmitModes } from "../../../src/index.js";
import { createProjectManager } from "../../../src/project/ProjectManager.js";
import { ODataModelBuilderV4 } from "../../data-model/builder/v4/ODataModelBuilderV4.js";
import {
  createHelper,
  EntityBasedGeneratorFunctionWithoutVersion,
  FixtureComparatorHelper,
} from "../comparator/FixtureComparatorHelper.js";
import { TestOptions } from "../TestTypes.js";
import { createEntityBasedGenerationTests, ENTITY_NAME, SERVICE_NAME } from "./EntityBasedGenerationTests.js";

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

  async function generateAndCompare(fixturePath: string, genOptions?: TestOptions) {
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
    await generateAndCompare("operation-min.ts");
  });

  test(`${TEST_SUITE_NAME}: min action param model`, async () => {
    // given a simple action
    // @note: return type doesn't affect param model
    odataBuilder.addAction("MinOperation", ODataTypesV4.Guid, false, (builder) =>
      builder.addParam("test", ODataTypesV4.String, false).addParam("optTest", ODataTypesV4.String, true),
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("operation-min.ts");
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
    await generateAndCompare("operation-max.ts");
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
    await generateAndCompare("operation-max.ts");
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
    await generateAndCompare("operation-bound.ts");
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
    // then the params model is named after the *collection* binding: an operation bound to a single
    // instance and one bound to the collection are different overloads and must not share a name.
    await generateAndCompare("operation-bound-collection.ts");
  });

  test(`${TEST_SUITE_NAME}: Entity relationships`, async () => {
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
    await generateAndCompare("entity-relationships.ts", {
      v2ModelsWithExtraResultsWrapping: true,
      skipEditableModels: false,
      skipIdModels: false,
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
    await generateAndCompare("entity-with-comments.ts", {
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
    await generateAndCompare("function-overload.ts");
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
    await generateAndCompare("function-overload.ts");
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
    await generateAndCompare("function-overload-multiple.ts", {});
  });

  test(`${TEST_SUITE_NAME}: binding notation of OData 4.01`, async () => {
    // given entities related to each other
    odataBuilder
      .addEntityType("Author", undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.Int32))
      .addEntityType(ENTITY_NAME, undefined, (builder) =>
        builder
          .addKeyProp("id", ODataTypesV4.Int32)
          .addProp("author", withNs("Author"), false)
          .addProp("altAuthor", withNs("Author"), true)
          .addProp("relatedAuthors", `Collection(${withNs("Author")})`),
      );

    // when generating for 4.01
    // then the editable model uses the short form instead of the @odata.bind notation
    await generateAndCompare("entity-relationships-v401.ts", {
      enableBindingProps: true,
      odataVersionV4: "4.01",
      skipEditableModels: false,
      skipIdModels: false,
      disableAutoManagedKey: true,
    });
  });

  test(`${TEST_SUITE_NAME}: no binding props for OData 4.01 by default`, async () => {
    // given entities related to each other
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

    // when generating for 4.01 without opting in
    // then no binding prop at all: in 4.01 it goes by the name of the navigation property itself,
    // so it must be absent rather than show up with the binding type
    await generateAndCompare("entity-relationships.ts", {
      odataVersionV4: "4.01",
      skipEditableModels: false,
      skipIdModels: false,
      disableAutoManagedKey: true,
    });
  });

  test(`${TEST_SUITE_NAME}: binding props of OData 4.0`, async () => {
    // given entities related to each other
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

    // when opting into the binding props
    // then the editable model allows to bind an existing entity via the @odata.bind notation
    await generateAndCompare("entity-relationships-binding.ts", {
      enableBindingProps: true,
      skipEditableModels: false,
      skipIdModels: false,
      disableAutoManagedKey: true,
    });
  });

  test(`${TEST_SUITE_NAME}: stream property is no part of any model`, async () => {
    // given an entity with a stream property
    odataBuilder.addEntityType("Audiobook", undefined, (builder) =>
      builder
        .addKeyProp("id", ODataTypesV4.Guid)
        .addProp("title", ODataTypesV4.String, false)
        .addProp("Sample", ODataTypesV4.Stream),
    );

    // when generating models
    // then `Sample` is absent from both models: binary content is not part of the JSON payload, so a
    // property of type string would promise a value no server ever sends - and it cannot be written
    // through create/update either, only through its own URL
    await generateAndCompare("entity-stream-property.ts", { skipEditableModels: false });
  });
});
