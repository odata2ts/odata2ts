import { DigestionOptions } from "../FactoryFunctionModel.js";
import {
  ComplexTypeGenerationOptions,
  EntityTypeGenerationOptions,
  GenericTypeGenerationOptions,
  PropertyGenerationOptions,
  TypeBasedGenerationOptions,
} from "../OptionModel.js";
import { TypeModel } from "../TypeModel.js";
import { NamespaceWithAlias, withNamespace } from "./DataModel.js";

export type WithoutName<T> = Omit<T, "name">;

export interface ConfiguredProp extends WithoutName<PropertyGenerationOptions> {}

const EXCEPTION_NO_NAME = "No value for required attribute [name] specified!";
const EXCEPTION_WRONG_NAME_TYPE =
  "Wrong type for attribute [name]! You have to supply either a plain string or a RegExp.";

interface MappingType<T> {
  names: Record<string, T>;
  regExps: Array<[RegExp, GenericTypeGenerationOptions]>;
}

function createMapping<T>(): MappingType<T> {
  return {
    names: {},
    regExps: [],
  };
}

export class ServiceConfigHelper {
  private propMapping = new Map<string, PropertyGenerationOptions>();
  private propRegExps: Array<[RegExp, PropertyGenerationOptions]> = [];
  private mapping = {
    [TypeModel.Any]: createMapping<GenericTypeGenerationOptions>(),
    [TypeModel.EntityType]: createMapping<EntityTypeGenerationOptions>(),
    [TypeModel.ComplexType]: createMapping<ComplexTypeGenerationOptions>(),
    [TypeModel.EnumType]: createMapping<GenericTypeGenerationOptions>(),
    [TypeModel.OperationType]: createMapping<GenericTypeGenerationOptions>(),
    [TypeModel.OperationImportType]: createMapping<GenericTypeGenerationOptions>(),
    [TypeModel.EntitySet]: createMapping<GenericTypeGenerationOptions>(),
    [TypeModel.Singleton]: createMapping<GenericTypeGenerationOptions>(),
  };

  constructor(options: DigestionOptions) {
    this.evaluateProps(options);
    this.evaluateEntities(options);
  }

  private evaluateProps(options: DigestionOptions) {
    options.propertiesByName.forEach((prop) => {
      if (!prop.name) {
        throw new Error(EXCEPTION_NO_NAME);
      }
      switch (typeof prop.name) {
        case "string":
          // TODO: check for existing prop.name and throw?
          this.propMapping.set(prop.name, prop);
          break;
        case "object":
          const { source, ignoreCase } = prop.name as RegExp;
          if (!source) {
            throw new Error(EXCEPTION_WRONG_NAME_TYPE);
          }
          this.propRegExps.push([new RegExp(`^${source}$`, ignoreCase ? "i" : ""), prop]);
          break;
        default:
          throw new Error(EXCEPTION_WRONG_NAME_TYPE);
      }
    });
  }

  private getPropByName(nameToMap: string): ConfiguredProp | undefined {
    const stringProp = this.propMapping.get(nameToMap);
    if (!stringProp) {
      return undefined;
    }
    const { name, ...attrs } = stringProp;
    return { ...attrs };
  }

  private getPropByRegExp(nameToMap: string): ConfiguredProp | undefined {
    const resultList = this.propRegExps
      .filter(([regExp]) => regExp.test(nameToMap))
      .map(([regExp, { name, mappedName, ...attrs }]) => ({
        mappedName: mappedName ? nameToMap.replace(regExp, mappedName) : undefined,
        ...attrs,
      }));

    return !resultList.length
      ? undefined
      : resultList.reduce<ConfiguredProp>((result, prop) => {
          return { ...result, ...prop };
        }, {});
  }

  public findPropConfigByName = (name: string): ConfiguredProp | undefined => {
    const stringProp = this.getPropByName(name);
    const reProp = this.getPropByRegExp(name);

    return stringProp && reProp ? { ...reProp, ...stringProp } : stringProp || reProp;
  };

  private evaluateEntities(options: DigestionOptions) {
    options.byTypeAndName.forEach((ent) => {
      if (!ent.name) {
        throw new Error(EXCEPTION_NO_NAME);
      }

      const mapping = this.mapping[ent.type];
      switch (typeof ent.name) {
        case "string":
          // TODO: check for existing prop.name and throw?
          mapping.names[ent.name] = ent;
          break;
        case "object":
          const { source, ignoreCase } = ent.name as RegExp;
          if (!source) {
            throw new Error(EXCEPTION_WRONG_NAME_TYPE);
          }
          const regExp = new RegExp(`^${source}$`, ignoreCase ? "i" : "");
          mapping.regExps.push(
            // @ts-ignore: too generic
            [regExp, ent]
          );
          break;
        default:
          throw new Error(EXCEPTION_WRONG_NAME_TYPE);
      }
    });
  }

  // get entity config by name matching: simple name or fully qualified name (alias also supported)
  private getByName<T extends TypeBasedGenerationOptions>(
    mapping: Record<string, TypeBasedGenerationOptions>,
    namespace: NamespaceWithAlias,
    nameToMap: string
  ) {
    const [ns, alias] = namespace;
    const hayStack = { ...this.mapping.Any.names, ...mapping };

    const config =
      hayStack[withNamespace(ns, nameToMap)] ||
      (alias ? hayStack[withNamespace(alias, nameToMap)] : undefined) ||
      hayStack[nameToMap];
    if (!config) {
      return undefined;
    }
    const { name, type, ...attrs } = config;
    return { ...attrs };
  }

  private getByRegExp(mapping: Array<[RegExp, any]>, [mainNs, alias]: NamespaceWithAlias, nameToMap: string) {
    const fqName = `${mainNs}.${nameToMap}`;
    const hayStack = [...this.mapping.Any.regExps, ...mapping];

    const resultList = hayStack
      .filter(([regExp, config]) => regExp.test(fqName))
      .map(([regExp, { name, mappedName, type, ...attrs }]) => ({
        mappedName: mappedName ? fqName.replace(regExp, mappedName) : undefined,
        ...attrs,
      }));

    return !resultList.length
      ? undefined
      : resultList.reduce((result, prop) => {
          return { ...result, ...prop };
        }, {});
  }

  private findConfig<T extends TypeBasedGenerationOptions>(
    mapping: MappingType<T>,
    namespace: NamespaceWithAlias,
    name: string
  ) {
    const stringEnt = this.getByName(mapping.names, namespace, name);
    const reEnt = this.getByRegExp(mapping.regExps, namespace, name);

    return stringEnt && reEnt ? { ...reEnt, ...stringEnt } : stringEnt || reEnt;
  }

  public findEntityTypeConfig(
    namespace: NamespaceWithAlias,
    name: string
  ): WithoutName<EntityTypeGenerationOptions> | undefined {
    return this.findConfig<EntityTypeGenerationOptions>(this.mapping.EntityType, namespace, name);
  }
  public findComplexTypeConfig(
    namespace: NamespaceWithAlias,
    name: string
  ): WithoutName<ComplexTypeGenerationOptions> | undefined {
    return this.findConfig(this.mapping.ComplexType, namespace, name);
  }
  public findEnumTypeConfig(
    namespace: NamespaceWithAlias,
    name: string
  ): WithoutName<GenericTypeGenerationOptions> | undefined {
    return this.findConfig(this.mapping.EnumType, namespace, name);
  }

  public findOperationTypeConfig(
    namespace: NamespaceWithAlias,
    name: string
  ): WithoutName<GenericTypeGenerationOptions> | undefined {
    return this.findConfig(this.mapping.OperationType, namespace, name);
  }

  public findOperationImportConfig(
    namespace: string,
    name: string
  ): WithoutName<GenericTypeGenerationOptions> | undefined {
    return this.findConfig(this.mapping.OperationImportType, [namespace], name);
  }

  public findEntitySetConfig(namespace: string, name: string): WithoutName<GenericTypeGenerationOptions> | undefined {
    return this.findConfig(this.mapping.EntitySet, [namespace], name);
  }

  public findSingletonConfig(namespace: string, name: string): WithoutName<GenericTypeGenerationOptions> | undefined {
    return this.findConfig(this.mapping.Singleton, [namespace], name);
  }
}
