import { DigestionOptions } from "../FactoryFunctionModel";
import { PropertyGenerationOptions } from "../OptionModel";

export interface ConfiguredProp extends Omit<PropertyGenerationOptions, "name"> {}

const EXCEPTION_NO_NAME = "PropertiesByName: No value for required attribute [name] specified!";
const EXCEPTION_WRONG_NAME_TYPE =
  "PropertiesByName: Wrong type for attribute [name]! You have to supply either a plain string or a RegExp.";

export class ServiceConfigHelper {
  private propMapping = new Map<string, PropertyGenerationOptions>();
  private propRegExps: Array<[RegExp, PropertyGenerationOptions]> = [];

  constructor(options: DigestionOptions) {
    this.evaluateProps(options);
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

  public findConfigPropByName = (name: string): ConfiguredProp | undefined => {
    const stringProp = this.getPropByName(name);
    const reProp = this.getPropByRegExp(name);

    return stringProp && reProp ? { ...reProp, ...stringProp } : stringProp || reProp;
  };
}
