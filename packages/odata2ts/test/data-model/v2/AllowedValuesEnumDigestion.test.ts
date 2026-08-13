import { describe } from "vitest";
import { digest } from "../../../src/data-model/DataModelDigestionV2.js";
import { createAllowedValuesEnumTests } from "../AllowedValuesEnumDigestionTests.js";
import { ODataModelBuilderV2 } from "../builder/v2/ODataModelBuilderV2.js";

describe("V2: AllowedValuesEnumDigestion Test", () => {
  createAllowedValuesEnumTests(ODataModelBuilderV2, digest);
});
