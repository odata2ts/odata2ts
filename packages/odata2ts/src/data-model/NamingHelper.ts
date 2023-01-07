import { camelCase } from "camel-case";
import { constantCase } from "constant-case";
import { pascalCase } from "pascal-case";
import { snakeCase } from "snake-case";

import { FileNamingStrategyOption, NameSettings, NamingStrategies, StandardNamingOptions } from "../NamingModel";
import { RunOptions } from "../OptionModel";

function getNamingStrategyImpl(strategy: NamingStrategies | undefined) {
  switch (strategy) {
    case NamingStrategies.CAMEL_CASE:
      return camelCase;
    case NamingStrategies.PASCAL_CASE:
      return pascalCase;
    case NamingStrategies.CONSTANT_CASE:
      return constantCase;
    case NamingStrategies.SNAKE_CASE:
      return snakeCase;
    default:
      return undefined;
  }
}

const noopNamingFunction = (value: string, options?: StandardNamingOptions) => {
  return (options?.prefix || "") + value + (options?.suffix || "");
};

export interface NamingHelperSettings extends Pick<RunOptions, "allowRenaming" | "naming"> {}

export class NamingHelper {
  private readonly allowModelPropRenaming: boolean;
  private readonly serviceName: string;
  private readonly servicePrefix: string;
  private readonly options: NameSettings;

  constructor(options: NamingHelperSettings, serviceName: string, overridingServiceName?: string) {
    if (!options) {
      throw new Error("NamingHelper: Options must be supplied!");
    }
    if (!serviceName?.trim()) {
      throw new Error("NamingHelper: ServicePrefix must be supplied!");
    }

    this.allowModelPropRenaming = options.allowRenaming ?? false;
    this.options = options.naming || {};
    this.servicePrefix = serviceName + ".";
    this.serviceName = overridingServiceName || serviceName;
  }

  /**
   * The prefix used to reference model or enum types in this schema.
   *
   * @returns service prefix
   */
  public getServicePrefix() {
    return this.servicePrefix;
  }

  /**
   * The OData service name as it was found and is used in metadata file.
   *
   * @returns
   */
  public getODataServiceName() {
    return this.serviceName;
  }

  public getFileNames() {
    return {
      model: this.getFileName(this.options.models?.fileName),
      qObject: this.getFileName(this.options.queryObjects?.fileName),
      service: this.getMainServiceName(),
    };
  }

  private getFileName(opts?: FileNamingStrategyOption & StandardNamingOptions) {
    return this.getName(this.serviceName, this.namingFunction(opts?.namingStrategy), opts);
  }

  public getFileNameService(name: string) {
    const opts = this.options.services;
    return this.getName(name, this.namingFunction(opts?.namingStrategy), opts);
  }

  public stripServicePrefix(token: string) {
    return token.replace(this.servicePrefix, "");
  }

  private namingFunction(strategy: NamingStrategies | undefined) {
    const strategyFn = getNamingStrategyImpl(strategy);
    if (!strategyFn || !this.allowModelPropRenaming) {
      return noopNamingFunction;
    }

    return (value: string, options?: StandardNamingOptions) => {
      const prefix = options?.prefix;
      const suffix = options?.suffix;
      const isPrefixSpecialChar = prefix?.startsWith("_");
      const isSuffixSpecialChar = suffix?.endsWith("_");

      let result = strategyFn((prefix ? prefix + "_" : "") + value + (suffix ? "_" + suffix : ""));
      if (isPrefixSpecialChar) {
        result = "_" + result;
      }
      if (isSuffixSpecialChar) {
        result = result + "_";
      }
      return result;
    };
  }

  private getName(
    name: string,
    strategy: (value: string, options?: StandardNamingOptions) => string,
    options?: StandardNamingOptions
  ) {
    return strategy(this.stripServicePrefix(name), options);
  }

  private getModelNamingStrategy() {
    return this.namingFunction(this.options.models?.namingStrategy);
  }

  private getModelPropNamingStrategy() {
    return this.namingFunction(this.options.models?.propNamingStrategy);
  }

  private getQObjectNamingStrategy() {
    return this.namingFunction(this.options.queryObjects?.namingStrategy);
  }

  private getQObjectPropNamingStrategy() {
    return this.namingFunction(this.options.queryObjects?.propNamingStrategy);
  }

  private getOperationNamingStrategy() {
    return this.namingFunction(this.options.services?.operations?.namingStrategy);
  }

  public getModelName(name: string): string {
    return this.getName(name, this.getModelNamingStrategy(), this.options.models);
  }

  public getModelPropName(name: string): string {
    return this.getName(name, this.getModelPropNamingStrategy());
  }

  public getEnumName(name: string) {
    return this.getName(name, this.getModelNamingStrategy(), this.options.models);
  }

  public getEditableModelName(name: string) {
    let options = this.options.models?.editableModels;
    const result = this.getName(name, this.getModelNamingStrategy(), options);
    return options?.applyModelNaming
      ? this.getName(result, this.getModelNamingStrategy(), this.options.models)
      : result;
  }

  public getIdModelName(name: string) {
    let options = this.options.models?.idModels;
    const result = this.getName(name, this.getModelNamingStrategy(), options);
    return options?.applyModelNaming
      ? this.getName(result, this.getModelNamingStrategy(), this.options.models)
      : result;
  }

  public getOperationParamsModelName(name: string) {
    const settings = this.options.models?.operationParamModels;
    const result = this.getName(name, this.getModelNamingStrategy(), settings);
    return settings?.applyModelNaming
      ? this.getName(result, this.getModelNamingStrategy(), this.options.models)
      : result;
  }

  public getQName(name: string) {
    return this.getName(name, this.getQObjectNamingStrategy(), this.options.queryObjects);
  }

  public getQPropName(name: string): string {
    return this.getName(name, this.getQObjectPropNamingStrategy());
  }

  public getQIdFunctionName(name: string) {
    const opts = this.options.queryObjects?.idFunctions;
    const result = this.getName(name, this.getQObjectNamingStrategy(), opts);
    return this.getName(result, this.getQObjectNamingStrategy(), this.options.queryObjects);
  }

  public getQFunctionName(name: string) {
    const opts = this.options.queryObjects?.operations;
    const result = this.getName(name, this.getQObjectNamingStrategy(), opts?.function || opts);
    return this.getName(result, this.getQObjectNamingStrategy(), this.options.queryObjects);
  }

  public getQActionName(name: string) {
    const opts = this.options.queryObjects?.operations;
    const result = this.getName(name, this.getQObjectNamingStrategy(), opts?.action || opts);
    return this.getName(result, this.getQObjectNamingStrategy(), this.options.queryObjects);
  }

  public getMainServiceName() {
    const name = this.getODataServiceName();
    const opts = this.options.services;
    const strategy = this.namingFunction(
      opts?.main?.namingStrategy ?? (opts?.main?.applyServiceNaming ? opts.namingStrategy : undefined)
    );
    const result = this.getName(name, strategy, opts?.main);
    return opts?.main?.applyServiceNaming ? this.getName(result, strategy, opts) : result;
  }

  public getServiceName = (name: string) => {
    const opts = this.options.services;
    return this.getName(name, this.namingFunction(opts?.namingStrategy), opts);
  };

  public getCollectionServiceName = (name: string) => {
    const opts = this.options.services;
    const strategy = this.namingFunction(opts?.namingStrategy);
    const result = this.getName(name, strategy, opts?.collection);
    return opts?.collection?.applyServiceNaming ? this.getName(result, strategy, opts) : result;
  };

  public getServiceResolverName = (name: string) => {
    const opts = this.options.services?.serviceResolverFunction;
    return this.getName(name, this.namingFunction(opts?.namingStrategy), opts);
  };

  public getFunctionName(name: string) {
    const opts = this.options.services?.operations;
    return this.getName(name, this.getOperationNamingStrategy(), opts?.function || opts);
  }

  public getActionName(name: string) {
    const opts = this.options.services?.operations;
    return this.getName(name, this.getOperationNamingStrategy(), opts?.action || opts);
  }

  public getRelatedServiceGetter(name: string) {
    const opts = this.options.services?.relatedServiceGetter;
    return this.getName(name, this.namingFunction(opts?.namingStrategy), opts);
  }

  public getPublicPropNameForService(name: string) {
    const opts = this.options.services?.publicProps;
    return this.getName(name, this.namingFunction(opts?.namingStrategy));
  }

  public getPrivatePropName = (name: string) => {
    const opts = this.options.services?.privateProps;
    return this.getName(name, this.namingFunction(opts?.namingStrategy), opts);
  };
}
