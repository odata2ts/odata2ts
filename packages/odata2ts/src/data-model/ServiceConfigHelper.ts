import { DigestionOptions } from "../FactoryFunctionModel";
import { EntityGenerationOptions, OperationGenerationOptions, PropertyGenerationOptions } from "../OptionModel";
import { NamespaceWithAlias, withNamespace } from "./DataModel";

export interface ConfiguredProp extends Omit<PropertyGenerationOptions, "name"> {}
export interface ConfiguredEntity extends Omit<EntityGenerationOptions, "name"> {}
export interface ConfiguredOperation extends Omit<OperationGenerationOptions, "name"> {}

const EXCEPTION_NO_NAME = "No value for required attribute [name] specified!";
const EXCEPTION_WRONG_NAME_TYPE =
  "Wrong type for attribute [name]! You have to supply either a plain string or a RegExp.";

export class ServiceConfigHelper {
  private propMapping = new Map<string, PropertyGenerationOptions>();
  private entityMapping = new Map<string, EntityGenerationOptions>();
  private operationMapping = new Map<string, OperationGenerationOptions>();
  private propRegExps: Array<[RegExp, PropertyGenerationOptions]> = [];
  private entityRegExps: Array<[RegExp, EntityGenerationOptions]> = [];
  private operationRegExps: Array<[RegExp, OperationGenerationOptions]> = [];

  constructor(options: DigestionOptions) {
    this.evaluateProps(options);
    this.evaluateEntities(options);
    this.evaluateOperations(options);
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
      return;
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
    options.entitiesByName.forEach((ent) => {
      if (!ent.name) {
        throw new Error(EXCEPTION_NO_NAME);
      }
      switch (typeof ent.name) {
        case "string":
          // TODO: check for existing prop.name and throw?
          this.entityMapping.set(ent.name, ent);
          break;
        case "object":
          const { source, ignoreCase } = ent.name as RegExp;
          if (!source) {
            throw new Error(EXCEPTION_WRONG_NAME_TYPE);
          }
          this.entityRegExps.push([new RegExp(`^${source}$`, ignoreCase ? "i" : ""), ent]);
          break;
        default:
          throw new Error(EXCEPTION_WRONG_NAME_TYPE);
      }
    });
  }

  // get entity config by name matching: simple name or fully qualified name (alias also supported)
  private getEntityByName(namespace: NamespaceWithAlias, nameToMap: string): ConfiguredEntity | undefined {
    const [ns, alias] = namespace;

    const config =
      this.entityMapping.get(withNamespace(ns, nameToMap)) ||
      (alias ? this.entityMapping.get(withNamespace(alias, nameToMap)) : undefined) ||
      this.entityMapping.get(nameToMap);
    if (!config) {
      return;
    }
    const { name, ...attrs } = config;
    return { ...attrs };
  }

  private getEntityByRegExp([mainNs, alias]: NamespaceWithAlias, nameToMap: string): ConfiguredEntity | undefined {
    const fqName = `${mainNs}.${nameToMap}`;
    const resultList = this.entityRegExps
      .filter(([regExp]) => regExp.test(fqName))
      .map(([regExp, { name, mappedName, ...attrs }]) => ({
        mappedName: mappedName ? fqName.replace(regExp, mappedName) : undefined,
        ...attrs,
      }));

    return !resultList.length
      ? undefined
      : resultList.reduce<ConfiguredEntity>((result, prop) => {
          return { ...result, ...prop };
        }, {});
  }

  public findEntityConfigByName = (namespace: NamespaceWithAlias, name: string): ConfiguredEntity | undefined => {
    const stringEnt = this.getEntityByName(namespace, name);
    const reEnt = this.getEntityByRegExp(namespace, name);

    return stringEnt && reEnt ? { ...reEnt, ...stringEnt } : stringEnt || reEnt;
  };

  private evaluateOperations(options: DigestionOptions) {
    options.operationsByName.forEach((op) => {
      if (!op.name) {
        throw new Error(EXCEPTION_NO_NAME);
      }
      switch (typeof op.name) {
        case "string":
          // TODO: check for existing operation name and throw?
          this.operationMapping.set(op.name, op);
          break;
        case "object":
          const { source, ignoreCase } = op.name as RegExp;
          if (!source) {
            throw new Error(EXCEPTION_WRONG_NAME_TYPE);
          }
          this.operationRegExps.push([new RegExp(`^${source}$`, ignoreCase ? "i" : ""), op]);
          break;
        default:
          throw new Error(EXCEPTION_WRONG_NAME_TYPE);
      }
    });
  }

  // get entity config by name matching: simple name or fully qualified name (alias also supported)
  private getOperationByName(namespace: NamespaceWithAlias, nameToMap: string): ConfiguredOperation | undefined {
    const [ns, alias] = namespace;

    const config =
      this.operationMapping.get(withNamespace(ns, nameToMap)) ||
      (alias ? this.operationMapping.get(withNamespace(alias, nameToMap)) : undefined) ||
      this.operationMapping.get(nameToMap);
    if (!config) {
      return;
    }
    const { name, ...attrs } = config;
    return { ...attrs };
  }

  private getOperationByRegExp(
    [mainNs, alias]: NamespaceWithAlias,
    nameToMap: string
  ): ConfiguredOperation | undefined {
    const fqName = `${mainNs}.${nameToMap}`;
    const resultList = this.operationRegExps
      .filter(([regExp]) => regExp.test(fqName))
      .map(([regExp, { name, mappedName, ...attrs }]) => ({
        mappedName: mappedName ? fqName.replace(regExp, mappedName) : undefined,
        ...attrs,
      }));

    return !resultList.length
      ? undefined
      : resultList.reduce<ConfiguredEntity>((result, prop) => {
          return { ...result, ...prop };
        }, {});
  }

  public findOperationConfigByName = (namespace: NamespaceWithAlias, name: string): ConfiguredOperation | undefined => {
    const stringEnt = this.getOperationByName(namespace, name);
    const reEnt = this.getOperationByRegExp(namespace, name);

    return stringEnt && reEnt ? { ...reEnt, ...stringEnt } : stringEnt || reEnt;
  };
}
