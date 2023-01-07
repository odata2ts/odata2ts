import deepmerge from "deepmerge";

import { NameSettings, NamingStrategies } from "./NamingModel";
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
        suffix: "",
        applyModelNaming: true,
      },
      idModels: {
        prefix: "",
        suffix: "Id",
        applyModelNaming: true,
      },
      operationParamModels: {
        prefix: "",
        suffix: "Params",
        applyModelNaming: true,
      },
      fileName: {
        namingStrategy: NamingStrategies.PASCAL_CASE,
        prefix: "",
        suffix: "Model",
      },
    },
    queryObjects: {
      namingStrategy: NamingStrategies.PASCAL_CASE,
      propNamingStrategy: NamingStrategies.CAMEL_CASE,
      prefix: "Q",
      suffix: "",
      idFunctions: {
        prefix: "",
        suffix: "Id",
      },
      fileName: {
        namingStrategy: NamingStrategies.PASCAL_CASE,
        prefix: "Q",
        suffix: "",
      },
    },
    services: {
      prefix: "",
      suffix: "Service",
      namingStrategy: NamingStrategies.PASCAL_CASE,
      main: {
        applyServiceNaming: true,
      },
      collection: {
        prefix: "",
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
        suffix: "",
      },
      privateProps: {
        namingStrategy: NamingStrategies.CAMEL_CASE,
        prefix: "_",
        suffix: "",
      },
      publicProps: {
        namingStrategy: NamingStrategies.PASCAL_CASE,
      },
    },
  },
  propertiesByName: [],
  // entitiesByName: [],
};

const { models, queryObjects, services } = defaultConfig.naming;
const minimalNamingConfig: NameSettings = {
  models: {
    fileName: {
      prefix: models.fileName.prefix,
      suffix: models.fileName.suffix,
    },
    idModels: {
      applyModelNaming: true,
      prefix: models.idModels.prefix,
      suffix: models.idModels.suffix,
    },
    editableModels: {
      applyModelNaming: true,
      prefix: models.editableModels.prefix,
      suffix: models.editableModels.suffix,
    },
    operationParamModels: {
      applyModelNaming: true,
      prefix: models.operationParamModels.prefix,
      suffix: models.operationParamModels.suffix,
    },
  },
  queryObjects: {
    prefix: queryObjects.prefix,
    suffix: queryObjects.suffix,
    fileName: {
      prefix: queryObjects.fileName.prefix,
      suffix: queryObjects.fileName.suffix,
    },
    idFunctions: {
      prefix: queryObjects.idFunctions.prefix,
      suffix: queryObjects.idFunctions.suffix,
    },
  },
  services: {
    prefix: services.prefix,
    suffix: services.suffix,
    main: {
      applyServiceNaming: true,
    },
    collection: {
      applyServiceNaming: true,
      prefix: services.collection.prefix,
      suffix: services.collection.suffix,
    },
    privateProps: {
      prefix: services.privateProps.prefix,
      suffix: services.privateProps.suffix,
    },
    relatedServiceGetter: {
      prefix: services.relatedServiceGetter.prefix,
      suffix: services.relatedServiceGetter.suffix,
    },
    serviceResolverFunction: {
      prefix: services.serviceResolverFunction.prefix,
      suffix: services.serviceResolverFunction.suffix,
    },
  },
};

/**
 * Creates a defensive copy of the default config.
 */
export function getDefaultConfig(): Omit<RunOptions, "source" | "output"> {
  return deepmerge(defaultConfig, {});
}

/**
 * Creates a defensive copy of the minimal config: minimal in respect to naming.
 */
export function getMinimalConfig(): Omit<RunOptions, "source" | "output"> {
  const { naming, ...passThrough } = defaultConfig;
  return deepmerge(passThrough, { naming: minimalNamingConfig });
}
