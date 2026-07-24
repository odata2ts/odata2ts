import { describe } from "vitest";
import { digest } from "../../../src/data-model/DataModelDigestionV4.js";
import { ODataVersion } from "../../../src/data-model/DataTypeModel.js";
import { ODataModelBuilderV4 } from "../builder/v4/ODataModelBuilderV4.js";
import { createDataModelTests } from "../DataModelDigestionTests.js";

describe("DataModelDigestion Test", () => {
  createDataModelTests(ODataVersion.V4, ODataModelBuilderV4, digest);
});
