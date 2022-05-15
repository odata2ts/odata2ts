import { createEntityBasedGenerationTests } from "./EntityBasedGenerationTests";
import { generateModels } from "../../../src/generator";

describe("Model Generator Tests V2", () => {
  createEntityBasedGenerationTests("Model Generator", "generator/model", (dataModel, sourceFile) => {
    return generateModels(dataModel, sourceFile);
  });
});
