import { describe } from "vitest";
import { digest } from "../../../src/data-model/DataModelDigestionV2.js";
import { createAnnotationTests } from "../AnnotationDigestionTests.js";
import { ODataModelBuilderV2 } from "../builder/v2/ODataModelBuilderV2.js";

describe("V2: AnnotationDigestion Test", () => {
  createAnnotationTests(ODataModelBuilderV2, digest);
});
