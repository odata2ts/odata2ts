import { PartialDeep } from "type-fest";

import { QEntityPathModel, QPathModel, QValuePathModel } from "./path/QPathModel";

function getMapping(q: QueryObject) {
  return Object.entries(q)
    .filter(
      (prop): prop is [string, QPathModel] => typeof prop[1] === "object" && typeof prop[1].getPath === "function"
    )
    .reduce<Map<string, string>>((collector, [key, value]) => {
      collector.set(value.getPath(), key);
      return collector;
    }, new Map());
}

export class QueryObject<T extends object = any> {
  private __propMapping?: Map<string, keyof this>;

  constructor(private __prefix?: string) {}

  private __getPropMapping(): Map<string, keyof this> {
    if (!this.__propMapping) {
      this.__propMapping = getMapping(this) as Map<string, keyof this>;
    }
    return this.__propMapping;
  }

  /**
   * Adds the prefix of this QueryObject including a separating slash in front of the given path.
   * Only applies, if this QueryObject has a prefix.
   *
   * @param path the path to be prefixed
   * @protected
   */
  protected withPrefix(path: string) {
    return this.__prefix ? `${this.__prefix}/${path}` : path;
  }

  /**
   * Convert the data model (or parts of it) as it is retrieved from the OData service to the data model
   * that the user is facing. This includes:
   * - renaming of property names
   * - converting property values to different types
   * - handling nested types
   *
   * Conversion rules:
   * - null & undefined are not converted, they're just passed back
   * - trying to convert primitive values will raise an error
   * - it's allowed to pass a single model or a collection of these
   * - unknown properties (not advertised in the metadata) are passed as they are
   *
   * @param odataModel data model as it is retrieved from the OData service
   * @returns the data model that the user is facing
   */
  public convertFromOData(odataModel: null): null;
  public convertFromOData(odataModel: undefined): undefined;
  public convertFromOData(odataModel: object): PartialDeep<T> | Array<PartialDeep<T>>;
  // public convertFromOData(odataModel: Array<object>): Array<PartialDeep<T>>;
  public convertFromOData(odataModel: object | Array<object> | null | undefined) {
    if (odataModel === null || odataModel === undefined) {
      return odataModel;
    }
    if (typeof odataModel !== "object") {
      throw new Error("The model must be an object!");
    }

    const isList = Array.isArray(odataModel);
    const models = isList ? (odataModel as Array<T>) : [odataModel];

    const result = models.map((model) => {
      return Object.entries(model).reduce<any>((collector, [key, value]) => {
        const propKey = this.__getPropMapping().get(key);
        const prop = propKey ? (this[propKey] as unknown as QValuePathModel) : undefined;
        if (prop && propKey) {
          // complex props
          const asComplexType = prop as QEntityPathModel<any>;
          if (typeof asComplexType.getEntity === "function") {
            // workaround: some V2 services wrap expanded entity collections in an extra results object #125
            // => we unwrap this to stay true to the generated model interfaces
            const wrappedValue = value as unknown as { results: Array<object> };
            const sanitizedValue =
              asComplexType.isCollectionType() &&
              wrappedValue &&
              typeof wrappedValue === "object" &&
              typeof wrappedValue.results === "object" &&
              Array.isArray(wrappedValue.results)
                ? wrappedValue.results
                : value;

            const entity = asComplexType.getEntity();
            collector[propKey] = entity.convertFromOData(sanitizedValue);
          }
          // primitive props
          else {
            collector[propKey] = prop.converter ? prop.converter.convertFrom(value) : value;
          }
        }
        // be permissive here to allow passing unknown values as they are
        else {
          collector[key] = value;
        }

        return collector;
      }, {}) as PartialDeep<T>;
    });

    return isList ? result : result[0];
  }

  /**
   * Convert the data model (or parts of it) that the user is facing to the data model as it is
   * used by the OData service. This includes:
   * - renaming of property names
   * - converting property values to different types
   * - handling nested types
   *
   * Conversion rules:
   * - null & undefined are not converted, they're just passed back
   * - primitive values will raise an error
   * - it's allowed to pass a single model or a collection of these
   * - passing unknown properties results in errors
   * - with the option allowUnknownProps=true unknown properties are passed as they are
   *
   * @param userModel the data model the user is facing
   * @param allowUnknownProps (false by default) passes unknown values as they are instead of raising an error
   * @retuns the data model that is consumable by the OData service
   */
  public convertToOData(userModel: null, allowUnknownProps?: boolean): null;
  public convertToOData(userModel: undefined, allowUnknownProps?: boolean): undefined;
  public convertToOData(userModel: PartialDeep<T>, allowUnknownProps?: boolean): object;
  public convertToOData(userModel: Array<PartialDeep<T>>, allowUnknownProps?: boolean): Array<object>;
  public convertToOData(
    userModel: PartialDeep<T> | Array<PartialDeep<T>> | null | undefined,
    allowUnknownProps = false
  ) {
    if (userModel === null || userModel === undefined) {
      return userModel;
    }
    if (typeof userModel !== "object") {
      throw new Error("The model must be an object!");
    }

    const isList = Array.isArray(userModel);
    const models = isList ? userModel : [userModel];

    const result = models.map((model) => {
      return Object.entries(model).reduce((collector, [key, value]) => {
        // @ts-ignore
        const prop: QValuePathModel = this[key];
        const asEntity = prop as QEntityPathModel<any>;
        if (typeof asEntity?.getEntity === "function") {
          const entity = asEntity.getEntity();
          collector[prop.getPath()] = entity.convertToOData(value);
        } else if (prop) {
          collector[prop.getPath()] = prop.converter ? prop.converter.convertTo(value) : value;
        } else if (!allowUnknownProps) {
          const knownProps = [...this.__getPropMapping().values()].join(",");
          throw new Error(`Property [${key}] not found (in strict mode)! Known user model props: ${knownProps}`);
        } else {
          // passing unknown value as is
          collector[key] = value;
        }

        return collector;
      }, {} as any);
    });

    return isList ? result : result[0];
  }
}
