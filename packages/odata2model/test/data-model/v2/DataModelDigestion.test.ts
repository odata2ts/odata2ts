import { ODataModelBuilderV2 } from "../builder/v2/ODataModelBuilderV2";
import { digest } from "../../../src/data-model/DataModelDigestionV2";
import { createDataModelTests } from "../DataModelDigestionTests";

describe("DataModelDigestion Test", () => {
  createDataModelTests(ODataModelBuilderV2, digest);
});
