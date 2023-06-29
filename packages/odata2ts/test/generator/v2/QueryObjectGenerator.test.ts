import { ODataTypesV2, ODataVersions } from "@odata2ts/odata-core";

import { RunOptions } from "../../../src";
import { digest } from "../../../src/data-model/DataModelDigestionV2";
import { generateQueryObjects } from "../../../src/generator";
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

  const GENERATE: EntityBasedGeneratorFunctionWithoutVersion = (dataModel, sourceFile, genOptions, namingHelper) => {
    return generateQueryObjects(dataModel, sourceFile, ODataVersions.V2, genOptions, namingHelper);
  };

  let odataBuilder: ODataModelBuilderV2;
  let fixtureComparatorHelper: FixtureComparatorHelper;

  createEntityBasedGenerationTests(TEST_SUITE_NAME, FIXTURE_BASE_PATH, GENERATE);

  async function generateAndCompare(id: string, fixturePath: string, genOptions?: Partial<RunOptions>) {
    await fixtureComparatorHelper.generateAndCompare(id, fixturePath, odataBuilder.getSchemas(), genOptions);
  }

  beforeAll(async () => {
    fixtureComparatorHelper = await createHelper(FIXTURE_BASE_PATH, digest, GENERATE);
  });

  beforeEach(() => {
    odataBuilder = new ODataModelBuilderV2(SERVICE_NAME);
  });

  test(`${TEST_SUITE_NAME}: min function param model`, async () => {
    // given a simple function
    odataBuilder.addFunctionImport("MinFunction", ODataTypesV2.String, (builder) =>
      builder.addParam("test", ODataTypesV2.String, false).addParam("optTest", ODataTypesV2.String, true)
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("minFunction", "function-min-v2.ts");
  });

  test(`${TEST_SUITE_NAME}: max function param model`, async () => {
    // given a simple function
    odataBuilder.addFunctionImport("MAX_FUNCTION", ODataTypesV2.String, (builder) =>
      builder
        .addParam("TEST_STRING", ODataTypesV2.String, false)
        .addParam("testInt16", ODataTypesV2.Int16, false)
        .addParam("testInt32", ODataTypesV2.Int32, false)
        .addParam("testByte", ODataTypesV2.Byte, false)
        .addParam("testSByte", ODataTypesV2.SByte, false)
        .addParam("testInt64", ODataTypesV2.Int64, false)
        .addParam("testSingle", ODataTypesV2.Single, false)
        .addParam("testDouble", ODataTypesV2.Double, false)
        .addParam("testDecimal", ODataTypesV2.Decimal, false)
        .addParam("testBoolean", ODataTypesV2.Boolean, false)
        .addParam("testGuid", ODataTypesV2.Guid, false)
        .addParam("testTime", ODataTypesV2.Time, false)
        .addParam("testDate", ODataTypesV2.DateTime, false)
        .addParam("testDateTimeOffset", ODataTypesV2.DateTimeOffset, false)
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("maxFunction", "function-max-v2.ts", {
      converters: [{ module: "@odata2ts/test-converters", use: ["booleanToNumberConverter"] }],
    });
  });
});
