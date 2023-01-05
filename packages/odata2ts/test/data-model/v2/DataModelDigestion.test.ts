import { digest } from "../../../src/data-model/DataModelDigestionV2";
import { ODataVersion } from "../../../src/data-model/DataTypeModel";
import { ODataModelBuilderV2 } from "../builder/v2/ODataModelBuilderV2";
import { createDataModelTests } from "../DataModelDigestionTests";

describe("DataModelDigestion Test", () => {
  createDataModelTests(ODataVersion.V2, ODataModelBuilderV2, digest);
});
