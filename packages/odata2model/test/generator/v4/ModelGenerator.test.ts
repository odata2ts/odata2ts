import { ODataTypesV4 } from "../../../lib/data-model/edmx/ODataEdmxModelV4";
import { digest } from "../../../src/data-model/DataModelDigestionV4";
import { ODataTypesV3 } from "../../../src/data-model/edmx/ODataEdmxModelV3";
import { generateModels } from "../../../src/generator";
import { RunOptions } from "../../../src/OptionModel";
import { ODataModelBuilderV4 } from "../../data-model/builder/v4/ODataModelBuilderV4";
import { FixtureComparatorHelper, createHelper } from "../comparator/FixtureComparatorHelper";
import { ENTITY_NAME, SERVICE_NAME, createEntityBasedGenerationTests } from "./EntityBasedGenerationTests";

describe("Model Generator Tests V4", () => {
  const TEST_SUITE_NAME = "Model Generator";
  const FIXTURE_BASE_PATH = "generator/model";

  let odataBuilder: ODataModelBuilderV4;
  let fixtureComparatorHelper: FixtureComparatorHelper;

  createEntityBasedGenerationTests(TEST_SUITE_NAME, FIXTURE_BASE_PATH, (dataModel, sourceFile) => {
    return generateModels(dataModel, sourceFile);
  });

  async function generateAndCompare(id: string, fixturePath: string, runOptions?: RunOptions) {
    await fixtureComparatorHelper.generateAndCompare(id, fixturePath, odataBuilder.getSchema(), runOptions);
  }

  beforeAll(async () => {
    fixtureComparatorHelper = await createHelper(FIXTURE_BASE_PATH, digest, generateModels);
  });

  beforeEach(() => {
    odataBuilder = new ODataModelBuilderV4(SERVICE_NAME);
  });

  test(`${TEST_SUITE_NAME}: min function param model`, async () => {
    // given a simple function
    odataBuilder.addFunction("MinOperation", ODataTypesV4.String, false, (builder) =>
      builder.addParam("test", ODataTypesV4.String, false).addParam("optTest", ODataTypesV4.String, true)
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("minFunction", "operation-min.ts");
  });

  test(`${TEST_SUITE_NAME}: min action param model`, async () => {
    // given a simple action
    // @note: return type doesn't affect param model
    odataBuilder.addAction("MinOperation", ODataTypesV4.Guid, false, (builder) =>
      builder.addParam("test", ODataTypesV4.String, false).addParam("optTest", ODataTypesV4.String, true)
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
        .addParam("testTime", ODataTypesV4.Time, false)
        .addParam("testDateOrDateTime", ODataTypesV4.Date, false)
        .addParam("testDateTimeOffset", ODataTypesV4.DateTimeOffset, false)
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
        .addParam("testTime", ODataTypesV4.Time, false)
        .addParam("testDateOrDateTime", ODataTypesV4.Date, false)
        .addParam("testDateTimeOffset", ODataTypesV4.DateTimeOffset, false)
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("maxAction", "operation-max.ts");
  });

  test(`${TEST_SUITE_NAME}: bound function`, async () => {
    // given one minimal model with bound function
    odataBuilder
      .addEntityType(ENTITY_NAME, undefined, (builder) => builder.addKeyProp("id", ODataTypesV3.Boolean))
      .addFunction("MinOperation", ODataTypesV4.String, true, (builder) =>
        builder
          .addParam("book", `${SERVICE_NAME}.Book`)
          .addParam("test", ODataTypesV4.String, false)
          .addParam("optTest", ODataTypesV4.String, true)
      );

    // when generating model
    // then match fixture text
    await generateAndCompare("minFunction", "operation-bound.ts");
  });
});
