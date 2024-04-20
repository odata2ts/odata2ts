import { getTestConfig, getTestConfigMinimal } from "../../test.config";
import { TestOptions, TestSettings } from "../TestTypes";

const DEFAULT_COMPARE_OPTS: TestOptions = {
  skipIdModels: true,
  skipEditableModels: true,
  skipOperations: false,
  skipComments: true,
};

export const DEFAULT_RUN_OPTIONS = {
  ...getTestConfig(),
  ...DEFAULT_COMPARE_OPTS,
} as TestSettings;

export const DEFAULT_MIN_OPTIONS = {
  ...getTestConfigMinimal(),
  ...DEFAULT_COMPARE_OPTS,
} as TestSettings;
