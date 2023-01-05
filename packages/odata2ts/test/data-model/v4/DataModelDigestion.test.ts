import { ODataModelBuilderV4 } from "../builder/v4/ODataModelBuilderV4";
import { digest } from "../../../src/data-model/DataModelDigestionV4";
import { createDataModelTests } from "../DataModelDigestionTests";
import { ODataVersion } from "../../../src/data-model/DataTypeModel";

describe("DataModelDigestion Test", () => {
  createDataModelTests(ODataVersion.V4, ODataModelBuilderV4, digest);
});
