import { ODataTypesV2, ODataVersions } from "@odata2ts/odata-core";

import { digest } from "../../../src/data-model/DataModelDigestionV2";
import { DigestionOptions } from "../../../src/FactoryFunctionModel";
import { generateModels } from "../../../src/generator";
import { ODataModelBuilderV2 } from "../../data-model/builder/v2/ODataModelBuilderV2";
import {
  EntityBasedGeneratorFunctionWithoutVersion,
  FixtureComparatorHelper,
  createHelper,
} from "../comparator/FixtureComparatorHelper";
import { SERVICE_NAME, createEntityBasedGenerationTests } from "./EntityBasedGenerationTests";

describe("Model Generator Tests V2", () => {
  const TEST_SUITE_NAME = "Model Generator";
  const FIXTURE_BASE_PATH = "generator/model";
  const GENERATE: EntityBasedGeneratorFunctionWithoutVersion = (dataModel, sourceFile, genOptions, namingHelper) => {
    return generateModels(dataModel, sourceFile, ODataVersions.V2, genOptions, namingHelper);
  };

  let odataBuilder: ODataModelBuilderV2;
  let fixtureComparatorHelper: FixtureComparatorHelper;

  createEntityBasedGenerationTests(TEST_SUITE_NAME, FIXTURE_BASE_PATH, GENERATE);

  async function generateAndCompare(id: string, fixturePath: string, genOptions?: Partial<DigestionOptions>) {
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
    odataBuilder.addFunctionImport("MinOperation", ODataTypesV2.String, (builder) =>
      builder.addParam("test", ODataTypesV2.String, false).addParam("optTest", ODataTypesV2.String, true)
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("minFunction", "operation-min.ts");
  });

  test(`${TEST_SUITE_NAME}: max function param model`, async () => {
    odataBuilder.addFunctionImport("maxOperation", ODataTypesV2.String, (builder) =>
      builder
        .addParam("test", ODataTypesV2.String, false)
        .addParam("testNumber", ODataTypesV2.Int32, false)
        .addParam("testBoolean", ODataTypesV2.Boolean, false)
        .addParam("testGuid", ODataTypesV2.Guid, false)
        .addParam("testTime", ODataTypesV2.Time, false)
        .addParam("testDateOrDateTime", ODataTypesV2.DateTime, false)
        .addParam("testDateTimeOffset", ODataTypesV2.DateTimeOffset, false)
    );

    // when generating model
    // then match fixture text
    await generateAndCompare("maxFunction", "operation-max.ts");
  });
});
