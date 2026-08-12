import { describe } from "vitest";
import { digest } from "../../../src/data-model/DataModelDigestionV4.js";
import { createAnnotationTests } from "../AnnotationDigestionTests.js";
import { ODataModelBuilderV4 } from "../builder/v4/ODataModelBuilderV4.js";

describe("V4: AnnotationDigestion Test", () => {
  createAnnotationTests(ODataModelBuilderV4, digest);
});
