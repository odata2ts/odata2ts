import { ODataTypesV4, ODataVersions } from "@odata2ts/odata-core";

import { EmitModes } from "../../../src";
import { digest } from "../../../src/data-model/DataModelDigestionV4";
import { DigestionOptions } from "../../../src/FactoryFunctionModel";
import { generateQueryObjects } from "../../../src/generator";
import { createProjectManager } from "../../../src/project/ProjectManager";
import { ODataModelBuilderV4 } from "../../data-model/builder/v4/ODataModelBuilderV4";
import {
  EntityBasedGeneratorFunctionWithoutVersion,
  FixtureComparatorHelper,
  createHelper,
} from "../comparator/FixtureComparatorHelper";
import { SERVICE_NAME } from "./EntityBasedGenerationTests";
import { ENTITY_NAME, createEntityBasedGenerationTests } from "./EntityBasedGenerationTests";

describe("Query Object Generator Tests V4", () => {
  const TEST_SUITE_NAME = "Query Object Generator";
  const FIXTURE_BASE_PATH = "generator/qobject";
  const MODEL_FILE = "QTester";

  const GENERATE: EntityBasedGeneratorFunctionWithoutVersion = async (dataModel, options, namingHelper) => {
    const projectManager = await createProjectManager("build/unitTest", EmitModes.ts, namingHelper, dataModel, {
      noOutput: true,
      bundledFileGeneration: true,
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

  async function generateAndCompare(id: string, fixturePath: string, genOptions?: Partial<DigestionOptions>) {
    await fixtureComparatorHelper.generateAndCompare(MODEL_FILE, fixturePath, odataBuilder.getSchemas(), genOptions);
  }

  beforeAll(async () => {
    fixtureComparatorHelper = await createHelper(FIXTURE_BASE_PATH, digest, GENERATE);
  });

  beforeEach(() => {
    odataBuilder = new ODataModelBuilderV4(SERVICE_NAME);
  });

  test(`min QFunction`, async () => {
    // given a simple function
    odataBuilder.addFunction("MinFunction", ODataTypesV4.String, false, (builder) =>
      builder.addParam("test", ODataTypesV4.String, false).addParam("optTest", ODataTypesV4.String, true)
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("minFunction", "function-min.ts");
  });

  test(`max QFunction`, async () => {
    // given a function
    odataBuilder
      .addComplexType("Complex", undefined, (builder) => builder.addProp("a", ODataTypesV4.String))
      .addEntityType("TheEntity", undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.String))
      .addEnumType("TheEnum", [{ name: "One", value: 1 }])
      .addFunction("MAX_FUNCTION", ODataTypesV4.String, false, (builder) =>
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
          .addParam("enum", `${withNs("TheEnum")}`)
      );

    // when generating model
    // then match fixture text
    await generateAndCompare("maxFunction", "function-max.ts", {
      converters: [{ module: "@odata2ts/test-converters", use: ["booleanToNumberConverter"] }],
    });
  });

  test(`bound QFunction`, async () => {
    // given one minimal model with bound function
    odataBuilder
      .addEntityType(ENTITY_NAME, undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.Boolean))
      .addFunction("MinFunction", ODataTypesV4.String, true, (builder) =>
        builder
          .addParam("book", `${withNs("Book")}`)
          .addParam("test", ODataTypesV4.String, false)
          .addParam("optTest", ODataTypesV4.Boolean, true)
      );

    // when generating model
    // then match fixture text
    await generateAndCompare("boundFunc", "function-bound.ts", {
      converters: [{ module: "@odata2ts/test-converters", use: ["booleanToNumberConverter"] }],
    });
  });

  test(`collection bound QFunction`, async () => {
    // given one minimal model with bound function
    odataBuilder
      .addEntityType(ENTITY_NAME, undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.Boolean))
      .addFunction("MinFunction", ODataTypesV4.String, true, (builder) =>
        builder
          .addParam("_it", `Collection(${withNs("Book")})`)
          .addParam("test", ODataTypesV4.String, false)
          .addParam("optTest", ODataTypesV4.Boolean, true)
      );

    // when generating model
    // then match fixture text => actually there's no diff in the generated q objects between bound-to-entity and bound-to-collection
    await generateAndCompare("collBoundFunc", "function-bound.ts", {
      converters: [{ module: "@odata2ts/test-converters", use: ["booleanToNumberConverter"] }],
    });
  });

  test(`min QAction`, async () => {
    // given a simple function
    odataBuilder.addAction("MinAction", ODataTypesV4.Boolean, false, (builder) =>
      builder.addParam("test", ODataTypesV4.String, false).addParam("opt_Test", ODataTypesV4.String, true)
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("minAction", "action-min.ts", {
      converters: [{ module: "@odata2ts/test-converters", use: ["booleanToNumberConverter"] }],
    });
  });

  test(`QAction with converter`, async () => {
    // given a simple function
    odataBuilder
      .addEntityType("Person", undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.String))
      .addAction("ActionWithConverter", `${withNs("Person")}`, false, (builder) =>
        builder.addParam("test", ODataTypesV4.String, false)
      );

    // when generating model
    // then match fixture text
    await generateAndCompare("actionWithConverter", "action-converter.ts", {
      converters: [{ module: "@odata2ts/test-converters", use: ["stringToPrefixModelConverter"] }],
    });
  });

  test(`bound QAction`, async () => {
    // given a simple function
    odataBuilder
      .addEntityType(ENTITY_NAME, undefined, (builder) => builder.addKeyProp("id", ODataTypesV4.Boolean))
      .addAction("BoundAction", ODataTypesV4.Boolean, true, (builder) =>
        builder
          .addParam("test", `${SERVICE_NAME}.${ENTITY_NAME}`, false)
          .addParam("opt_Test", ODataTypesV4.String, true)
      );

    // when generating model
    // then match fixture text
    await generateAndCompare("boundAction", "action-bound.ts");
  });

  test(`QFunction with overloaded params`, async () => {
    const funcName = "OverloadedFunction";
    // given an overloaded function
    odataBuilder
      .addFunction(funcName, ODataTypesV4.String, false, (builder) =>
        builder.addParam("test", ODataTypesV4.String, false).addParam("optTest", ODataTypesV4.String, true)
      )
      .addFunction(funcName, ODataTypesV4.String, false, (builder) => {
        builder.addParam("id", ODataTypesV4.Guid);
      });

    // when generating model
    // then match fixture text
    await generateAndCompare("overloadedFunction", "function-overloaded.ts");
  });

  test(`QFunction with overloaded params 2`, async () => {
    const funcName = "OverloadedFunction";
    // given an overloaded function
    odataBuilder
      .addFunction(funcName, ODataTypesV4.String, false)
      .addFunction(funcName, ODataTypesV4.String, false, (builder) => {
        builder.addParam("test", ODataTypesV4.String, false);
      });

    // when generating model
    // then match fixture text
    await generateAndCompare("overloadedFunction2", "function-overloaded-2.ts");
  });
});
