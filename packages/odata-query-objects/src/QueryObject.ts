import { PartialDeep } from "type-fest";
import { QEntityPathModel, QValuePathModel } from "./path/QPathModel";
import { FlexibleConversionModel, QueryObjectModel } from "./QueryObjectModel";

function getMapping(q: QueryObject) {
  // need to use a for-in loop, because of getters which are located at the prototype level
  const result = new Map<string, string>();
  for (let key in q) {
    // @ts-ignore
    const value = q[key];
    if (typeof value === "object" && typeof value.getPath === "function") {
      const odataName = value.getPath();
      result.set(odataName, key);
    }
  }
  return result;
}

export const ENUMERABLE_PROP_DEFINITION = { enumerable: true };

export class QueryObject<T extends object = any> implements QueryObjectModel<T, PartialDeep<T>> {
  private __propMapping?: Map<string, keyof this>;
  protected readonly __subtypeMapping?: Record<string, string>;

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
  public convertFromOData(odataModel: FlexibleConversionModel<any>): FlexibleConversionModel<PartialDeep<T>> {
    if (odataModel === null || odataModel === undefined) {
      return odataModel;
    }
    if (typeof odataModel !== "object") {
      throw new Error("The model must be an object!");
    }

    const isList = Array.isArray(odataModel);
    const models = isList ? (odataModel as Array<T>) : [odataModel];

    const result = models.map((model) => {
      const typeByCi = model["@odata.type"]?.replace(/^#/, "");
      return Object.entries(model).reduce((collector, [key, value]) => {
        let propKey = this.__getPropMapping().get(key);
        let finalKey: string = propKey as string;

        if (typeByCi) {
          const newPropKey = this.__getPropMapping().get(`${typeByCi}/${key}`);
          if (newPropKey && typeof this.__subtypeMapping !== "undefined") {
            propKey = newPropKey;
            finalKey = (newPropKey as string).replace(new RegExp(`^${this.__subtypeMapping[typeByCi]}_`), "");
          }
        }
        const prop = propKey ? (this[propKey] as unknown as QValuePathModel) : undefined;
        if (prop && finalKey) {
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
            collector[finalKey] = entity.convertFromOData(sanitizedValue);
          }
          // primitive props
          else {
            collector[finalKey] = prop.converter ? prop.converter.convertFrom(value) : value;
          }
        }
        // be permissive here to allow passing unknown values as they are
        else {
          collector[key] = value;
        }

        return collector;
      }, {} as any) as PartialDeep<T>;
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
   * - passing unknown properties is fine
   * - with the option failForUnknownProps=true passing unknown props results in errors
   *
   * @param userModel the data model the user is facing
   * @param failForUnknownProps (false by default) raise an error for unknown props
   * @retuns the data model that is consumable by the OData service
   */
  public convertToOData(userModel: null, failForUnknownProps?: boolean): null;
  public convertToOData(userModel: undefined, failForUnknownProps?: boolean): undefined;
  public convertToOData(userModel: PartialDeep<T>, failForUnknownProps?: boolean): object;
  public convertToOData(userModel: Array<PartialDeep<T>>, failForUnknownProps?: boolean): Array<object>;
  public convertToOData(
    userModel: PartialDeep<T> | Array<PartialDeep<T>> | null | undefined,
    failForUnknownProps = false,
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
      // @ts-ignore
      const typeByCi = model["@odata.type"]?.replace(/^#/, "");
      return Object.entries(model).reduce((collector, [key, value]) => {
        let prop = this[key as keyof this] as QValuePathModel | undefined;
        let finalKey = prop?.getPath();
        if (typeByCi && typeof this.__subtypeMapping !== "undefined") {
          const qName = this.__subtypeMapping[typeByCi];
          const subProp = this[`${qName}_${key}` as keyof this] as QValuePathModel | undefined;
          if (subProp) {
            prop = subProp;
            finalKey = subProp.getPath().replace(new RegExp(`^${typeByCi}/`), "");
          }
        }
        const asEntity = prop as QEntityPathModel<any>;
        if (typeof asEntity?.getEntity === "function") {
          const entity = asEntity.getEntity();
          collector[finalKey!] = entity.convertToOData(value);
        } else if (prop) {
          collector[finalKey!] = prop.converter ? prop.converter.convertTo(value) : value;
        }
        // control information is passed as is
        else if (key.startsWith("@")) {
          collector[key] = value;
        } else if (failForUnknownProps) {
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
