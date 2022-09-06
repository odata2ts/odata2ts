import { ODataVesions } from "../../../src/app";
import { digest } from "../../../src/data-model/DataModelDigestionV2";
import { ODataTypesV3 } from "../../../src/data-model/edmx/ODataEdmxModelV3";
import { generateQueryObjects } from "../../../src/generator";
import { GenerationOptions } from "../../../src/OptionModel";
import { ODataModelBuilderV2 } from "../../data-model/builder/v2/ODataModelBuilderV2";
import {
  EntityBasedGeneratorFunctionWithoutVersion,
  FixtureComparatorHelper,
  createHelper,
} from "../comparator/FixtureComparatorHelper";
import { SERVICE_NAME, createEntityBasedGenerationTests } from "./EntityBasedGenerationTests";

describe("Query Object Generator Tests V2", () => {
  const TEST_SUITE_NAME = "Query Object Generator";
  const FIXTURE_BASE_PATH = "generator/qobject";

  const GENERATE: EntityBasedGeneratorFunctionWithoutVersion = (dataModel, sourceFile, genOptions) => {
    return generateQueryObjects(dataModel, sourceFile, ODataVesions.V2, genOptions);
  };

  let odataBuilder: ODataModelBuilderV2;
  let fixtureComparatorHelper: FixtureComparatorHelper;

  createEntityBasedGenerationTests(TEST_SUITE_NAME, FIXTURE_BASE_PATH, GENERATE);

  async function generateAndCompare(id: string, fixturePath: string, genOptions?: GenerationOptions) {
    await fixtureComparatorHelper.generateAndCompare(id, fixturePath, odataBuilder.getSchema(), genOptions);
  }

  beforeAll(async () => {
    fixtureComparatorHelper = await createHelper(FIXTURE_BASE_PATH, digest, GENERATE);
  });

  beforeEach(() => {
    odataBuilder = new ODataModelBuilderV2(SERVICE_NAME);
  });

  test(`${TEST_SUITE_NAME}: min function param model`, async () => {
    // given a simple function
    odataBuilder.addFunctionImport("MinFunction", ODataTypesV3.String, (builder) =>
      builder.addParam("test", ODataTypesV3.String, false).addParam("optTest", ODataTypesV3.String, true)
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("minFunction", "function-min-v2.ts");
  });

  test(`${TEST_SUITE_NAME}: max function param model`, async () => {
    // given a simple function
    odataBuilder.addFunctionImport("MAX_FUNCTION", ODataTypesV3.String, (builder) =>
      builder
        .addParam("TEST_STRING", ODataTypesV3.String, false)
        .addParam("testNumber", ODataTypesV3.Int32, false)
        .addParam("testBoolean", ODataTypesV3.Boolean, false)
        .addParam("testGuid", ODataTypesV3.Guid, false)
        .addParam("testTime", ODataTypesV3.Time, false)
        .addParam("testDate", ODataTypesV3.DateTime, false)
        .addParam("testDateTimeOffset", ODataTypesV3.DateTimeOffset, false)
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("maxFunction", "function-max-v2.ts");
  });
});
