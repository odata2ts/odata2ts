import deepmerge from "deepmerge";

import { NamingStrategies } from "./NamingModel";
import { EmitModes, Modes, RunOptions } from "./OptionModel";

/**
 * The default configuration.
 */
const defaultConfig: Omit<RunOptions, "source" | "output"> = {
  mode: Modes.all,
  emitMode: EmitModes.js_dts,
  debug: false,
  prettier: false,
  converters: [],
  skipEditableModels: false,
  skipIdModels: false,
  skipOperations: false,
  naming: {
    models: {
      namingStrategy: NamingStrategies.PASCAL_CASE,
      propNamingStrategy: NamingStrategies.CAMEL_CASE,
    },
    editableModels: {
      prefix: "Editable",
      applyModelNaming: true,
    },
    idModels: {
      suffix: "Id",
      applyModelNaming: true,
    },
    queryObjects: {
      namingStrategy: NamingStrategies.PASCAL_CASE,
      propNamingStrategy: NamingStrategies.CAMEL_CASE,
      prefix: "Q",
    },
    operations: {
      namingStrategy: NamingStrategies.PASCAL_CASE,
      paramModel: {
        namingStrategy: NamingStrategies.CAMEL_CASE,
      },
    },
  },
  propertyTypes: [],
  modelTypes: [],
};

/**
 * Creates a defensive copy of the default config.
 */
export function getDefaultConfig(): Omit<RunOptions, "source" | "output"> {
  return deepmerge(defaultConfig, {});
}
