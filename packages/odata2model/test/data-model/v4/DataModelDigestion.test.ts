import { ODataModelBuilderV4 } from "../builder/v4/ODataModelBuilderV4";
import { digest } from "../../../src/data-model/DataModelDigestionV4";
import { createDataModelTests } from "../DataModelDigestionTests";

describe("DataModelDigestion Test", () => {
  createDataModelTests(ODataModelBuilderV4, digest);
});
