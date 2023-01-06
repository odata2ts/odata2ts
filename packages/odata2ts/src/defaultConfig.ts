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
      suffix: "Service",
      namingStrategy: NamingStrategies.PASCAL_CASE,
      collection: {
        suffix: "Collection",
        applyServiceNaming: true,
      },
      serviceResolverFunction: {
        namingStrategy: NamingStrategies.CAMEL_CASE,
        prefix: "create",
        suffix: "serviceResolver",
      },
      operations: {
        namingStrategy: NamingStrategies.CAMEL_CASE,
      },
      relatedServiceGetter: {
        namingStrategy: NamingStrategies.CAMEL_CASE,
        prefix: "navTo",
      },
      fileNames: {
        namingStrategy: NamingStrategies.PASCAL_CASE,
        suffix: "Service",
      },
      privateProps: {
        namingStrategy: NamingStrategies.CAMEL_CASE,
        prefix: "_",
      },
      publicProps: {
        namingStrategy: NamingStrategies.PASCAL_CASE,
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
