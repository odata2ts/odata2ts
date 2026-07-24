import { describe } from "vitest";
import { digest } from "../../../src/data-model/DataModelDigestionV2.js";
import { ODataVersion } from "../../../src/data-model/DataTypeModel.js";
import { ODataModelBuilderV2 } from "../builder/v2/ODataModelBuilderV2.js";
import { createDataModelTests } from "../DataModelDigestionTests.js";

describe("DataModelDigestion Test", () => {
  createDataModelTests(ODataVersion.V2, ODataModelBuilderV2, digest);
});
