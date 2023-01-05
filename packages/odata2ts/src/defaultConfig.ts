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
  tsconfig: "tsconfig.json",
  converters: [],
  skipEditableModels: false,
  skipIdModels: false,
  skipOperations: false,
  disableAutoManagedKey: false,
  allowRenaming: false,
  naming: {
    models: {
      namingStrategy: NamingStrategies.PASCAL_CASE,
      propNamingStrategy: NamingStrategies.CAMEL_CASE,
      editableModels: {
        prefix: "Editable",
        applyModelNaming: true,
      },
      idModels: {
        suffix: "Id",
        applyModelNaming: true,
      },
      operationParamModels: {
        suffix: "Params",
        applyModelNaming: true,
      },
      fileName: {
        namingStrategy: NamingStrategies.PASCAL_CASE,
        suffix: "Model",
      },
    },
    queryObjects: {
      namingStrategy: NamingStrategies.PASCAL_CASE,
      propNamingStrategy: NamingStrategies.CAMEL_CASE,
      prefix: "Q",
      idFunctions: {
        suffix: "Id",
      },
      fileName: {
        namingStrategy: NamingStrategies.PASCAL_CASE,
        prefix: "Q",
      },
    },
    services: {
      namingStrategy: NamingStrategies.PASCAL_CASE,
      suffix: "Service",
      collection: {
        suffix: "Collection",
        applyServiceNaming: true,
      },
      operations: {
        namingStrategy: NamingStrategies.CAMEL_CASE,
      },
      relatedServiceGetter: {
        namingStrategy: NamingStrategies.CAMEL_CASE,
        prefix: "get",
        suffix: "Srv",
      },
      fileNames: {
        namingStrategy: NamingStrategies.PASCAL_CASE,
        suffix: "Service",
      },
      privateProps: {
        namingStrategy: NamingStrategies.CAMEL_CASE,
        prefix: "_",
      },
    },
  },
  propertiesByName: [],
  // entitiesByName: [],
};

/**
 * Creates a defensive copy of the default config.
 */
export function getDefaultConfig(): Omit<RunOptions, "source" | "output"> {
  return deepmerge(defaultConfig, {});
}
