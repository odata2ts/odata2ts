import { QEntityPath, QPath, QPathModel } from "./path";

function getMapping(q: QueryObject) {
  return Object.entries(q)
    .filter((prop): prop is [string, QPath] => typeof prop[1] === "object" && typeof prop[1].getPath === "function")
    .reduce<Map<string, string>>((collector, [key, value]) => {
      collector.set(value.getPath(), key);
      return collector;
    }, new Map());
}

export class QueryObject<T = any> {
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
   * Unknown properties (not advertised in the metadata) are passed as they are.
   *
   * @param odataModel data model as it is retrieved from the OData service
   * @returns the data model that the user is facing
   */
  public convertFromOData(odataModel: object): Partial<T> {
    if (typeof odataModel !== "object") {
      throw new Error("The model must be an object!");
    }

    return Object.entries(odataModel).reduce<any>((collector, [key, value]) => {
      const propKey = this.__getPropMapping().get(key);
      const prop = propKey ? (this[propKey] as unknown as QPathModel) : undefined;
      if (prop && propKey) {
        const asEntity = prop as QEntityPath<any>;
        if (typeof asEntity.getEntity === "function") {
          collector[propKey] = asEntity.getEntity().convertFromOData(value);
        } else {
          collector[propKey] = prop.converter ? prop.converter.convertFrom(value) : value;
        }
      }
      // be permissive here to allow passing unknown values as they are
      else {
        collector[key] = value;
      }

      return collector;
    }, {}) as T;
  }

  /**
   * Convert the data model (or parts of it) that the user is facing to the data model as it is
   * used by the OData service. This includes:
   * - renaming of property names
   * - converting property values to different types
   * - handling nested types
   *
   * Passing unknown properties results in errors.
   *
   * @param userModel the data model the user is facing
   * @retuns the data model that is consumable by the OData service
   */
  public convertToOData(userModel: Partial<T>): object {
    if (typeof userModel !== "object") {
      throw new Error("The model must be an object!");
    }

    return Object.entries(userModel).reduce((collector, [key, value]) => {
      // @ts-ignore
      const prop: QPathModel = this[key];
      const asEntity = prop as QEntityPath<any>;
      if (typeof asEntity?.getEntity === "function") {
        collector[prop.getPath()] = asEntity.getEntity().convertToOData(value);
      } else if (prop) {
        collector[prop.getPath()] = prop.converter ? prop.converter.convertTo(value) : value;
      } else {
        const knownProps = [...this.__getPropMapping().values()].join(",");
        throw new Error(`Property [${key}] not found (in strict mode)! Known user model props: ${knownProps}`);
      }

      return collector;
    }, {} as any);
  }
}
