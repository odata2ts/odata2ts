import { ODataTypesV3 } from "../../../lib/data-model/edmx/ODataEdmxModelV3";
import { digest } from "../../../src/data-model/DataModelDigestionV2";
import { generateModels } from "../../../src/generator";
import { RunOptions } from "../../../src/OptionModel";
import { ODataModelBuilderV2 } from "../../data-model/builder/v2/ODataModelBuilderV2";
import { FixtureComparatorHelper, createHelper } from "../comparator/FixtureComparatorHelper";
import { SERVICE_NAME, createEntityBasedGenerationTests } from "./EntityBasedGenerationTests";

describe("Model Generator Tests V2", () => {
  const TEST_SUITE_NAME = "Model Generator";
  const FIXTURE_BASE_PATH = "generator/model";

  let odataBuilder: ODataModelBuilderV2;
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
    odataBuilder = new ODataModelBuilderV2(SERVICE_NAME);
  });

  test(`${TEST_SUITE_NAME}: min function param model`, async () => {
    // given a simple function
    odataBuilder.addFunctionImport("MinOperation", ODataTypesV3.String, (builder) =>
      builder.addParam("test", ODataTypesV3.String, false).addParam("optTest", ODataTypesV3.String, true)
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("minFunction", "operation-min.ts");
  });

  test(`${TEST_SUITE_NAME}: max function param model`, async () => {
    odataBuilder.addFunctionImport("maxOperation", ODataTypesV3.String, (builder) =>
      builder
        .addParam("test", ODataTypesV3.String, false)
        .addParam("testNumber", ODataTypesV3.Int32, false)
        .addParam("testBoolean", ODataTypesV3.Boolean, false)
        .addParam("testGuid", ODataTypesV3.Guid, false)
        .addParam("testTime", ODataTypesV3.Time, false)
        .addParam("testDateOrDateTime", ODataTypesV3.DateTime, false)
        .addParam("testDateTimeOffset", ODataTypesV3.DateTimeOffset, false)
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("maxFunction", "operation-max.ts");
  });
});
