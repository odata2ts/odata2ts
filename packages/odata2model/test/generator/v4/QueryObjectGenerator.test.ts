import { createEntityBasedGenerationTests } from "./EntityBasedGenerationTests";
import { generateQueryObjects } from "../../../src/generator";

describe("Query Object Generator Tests V4", () => {
  createEntityBasedGenerationTests("Query Object Generator", "generator/qobject", (dataModel, sourceFile) => {
    return generateQueryObjects(dataModel, sourceFile);
  });
});
