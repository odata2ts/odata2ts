import { RunOptions, ServiceGenerationOptions } from "../../src/index.js";

export type TestOptions = Omit<ServiceGenerationOptions, "source" | "output">;
export type TestSettings = Omit<RunOptions, "source" | "output">;
