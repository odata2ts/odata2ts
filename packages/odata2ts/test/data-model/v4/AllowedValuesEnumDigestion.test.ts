import { describe } from "vitest";
import { digest } from "../../../src/data-model/DataModelDigestionV4.js";
import { createAllowedValuesEnumTests } from "../AllowedValuesEnumDigestionTests.js";
import { ODataModelBuilderV4 } from "../builder/v4/ODataModelBuilderV4.js";

describe("V4: AllowedValuesEnumDigestion Test", () => {
  createAllowedValuesEnumTests(ODataModelBuilderV4, digest);
});
