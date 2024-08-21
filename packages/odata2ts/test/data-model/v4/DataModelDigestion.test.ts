import { describe } from "vitest";
import { digest } from "../../../src/data-model/DataModelDigestionV4";
import { ODataVersion } from "../../../src/data-model/DataTypeModel";
import { ODataModelBuilderV4 } from "../builder/v4/ODataModelBuilderV4";
import { createDataModelTests } from "../DataModelDigestionTests";

describe("DataModelDigestion Test", () => {
  createDataModelTests(ODataVersion.V4, ODataModelBuilderV4, digest);
});
