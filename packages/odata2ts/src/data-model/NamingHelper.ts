import { camelCase } from "camel-case";
import { constantCase } from "constant-case";
import { pascalCase } from "pascal-case";
import { snakeCase } from "snake-case";

import { FileNamingStrategyOption, NameSettings, NamingStrategies, StandardNamingOptions } from "../NamingModel";
import { RunOptions } from "../OptionModel";
import { PropertyModel } from "./DataTypeModel";

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
  private readonly mainServiceName: string;
  private readonly servicePrefixes: Array<string>;
  private readonly options: NameSettings;

  constructor(options: NamingHelperSettings, mainServiceName: string, serviceNames?: Array<string>) {
    if (!options) {
      throw new Error("NamingHelper: Options must be supplied!");
    }
    if (!mainServiceName?.trim()) {
      throw new Error("NamingHelper: MainServiceName must be supplied!");
    }

    if (!serviceNames?.length) {
      serviceNames = [mainServiceName];
    }

    this.allowModelPropRenaming = options.allowRenaming ?? false;
    this.options = options.naming;
    this.mainServiceName = mainServiceName;
    this.servicePrefixes = serviceNames
      .map((sn) => sn + ".")
      .sort((a, b) => (a.length === b.length ? 0 : a.length > b.length ? -1 : 1));
  }

  /**
   * The prefix used to reference model or enum types in this schema.
   *
   * @returns service prefix
   */
  public includesServicePrefix(name: string) {
    for (let prefix of this.servicePrefixes) {
      if (name.startsWith(prefix)) {
        return true;
      }
    }
    return false;
  }

  /**
   * The OData service name as it was found and is used in metadata file.
   *
   * @returns
   */
  public getODataServiceName() {
    return this.mainServiceName;
  }

  public getFileNames() {
    return {
      model: this.getFileName(this.options.models?.fileName),
      qObject: this.getFileName(this.options.queryObjects?.fileName),
      service: this.getMainServiceName(),
    };
  }

  private getFileName(opts?: FileNamingStrategyOption & StandardNamingOptions) {
    return this.getName(this.mainServiceName, this.namingFunction(opts?.namingStrategy), opts);
  }

  public getFileNameService(name: string) {
    const opts = this.options.services;
    return this.getName(name, this.namingFunction(opts?.namingStrategy), opts);
  }

  public stripServicePrefix(token: string) {
    const found = this.servicePrefixes.find((prefix) => token.startsWith(prefix));
    return found ? token.replace(found, "") : token;
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

  public getOperationParamsModelName(operationName: string, boundEntity?: PropertyModel | undefined) {
    const settings = this.options.models?.operationParamModels;
    const result = this.getName(operationName, this.getModelNamingStrategy(), settings);
    const name = settings?.applyModelNaming
      ? this.getName(result, this.getModelNamingStrategy(), this.options.models)
      : result;
    return this.getPrefixedName(name, boundEntity);
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

  public getQFunctionName(operationName: string, boundEntity?: PropertyModel | undefined) {
    const opts = this.options.queryObjects?.operations;
    const result = this.getName(operationName, this.getQObjectNamingStrategy(), opts?.function || opts);
    const name = this.getName(result, this.getQObjectNamingStrategy(), this.options.queryObjects);
    return this.getPrefixedName(name, boundEntity);
  }

  public getQActionName(operationName: string, boundEntity?: PropertyModel | undefined) {
    const opts = this.options.queryObjects?.operations;
    const result = this.getName(operationName, this.getQObjectNamingStrategy(), opts?.action || opts);
    const name = this.getName(result, this.getQObjectNamingStrategy(), this.options.queryObjects);
    return this.getPrefixedName(name, boundEntity);
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

  private getPrefixedName(name: string, boundEntity: PropertyModel | undefined) {
    return boundEntity?.type ? boundEntity.type + "_" + name : name;
  }

  public getFunctionName(operationName: string) {
    const opts = this.options.services?.operations;
    return this.getName(operationName, this.getOperationNamingStrategy(), opts?.function || opts);
  }

  public getActionName(operationName: string) {
    const opts = this.options.services?.operations;
    return this.getName(operationName, this.getOperationNamingStrategy(), opts?.action || opts);
  }

  public getRelatedServiceGetter(name: string) {
    const opts = this.options.services?.relatedServiceGetter;
    return this.getName(name, this.namingFunction(opts?.namingStrategy), opts);
  }

  public getPrivatePropName = (name: string) => {
    const opts = this.options.services?.privateProps;
    return this.getName(name, this.namingFunction(opts?.namingStrategy), opts);
  };
}
