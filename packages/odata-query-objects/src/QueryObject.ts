import { QBinding } from "./path/QBinding";
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

/**
 * Retrieves the type control information of a model, which is used to detect subtypes.
 *
 * odata2ts targets OData 4.0, where this control information is named {@code @odata.type} and its value is
 * prefixed with a hash symbol. Payloads of 4.01 or greater omit the {@code odata.} prefix and, for built-in
 * primitive types, also the hash symbol. Since the response version is up to the service, both spellings are
 * accepted here.
 *
 * See https://docs.oasis-open.org/odata/odata-json-format/v4.01/odata-json-format-v4.01.html#sec_ControlInformationtypeodatatype
 */
function getTypeControlInfo(model: any): string | undefined {
  return (model["@odata.type"] ?? model["@type"])?.replace(/^#/, "");
}

/**
 * The property by which the editable models state a binding to an already existing entity, carrying its
 * key. It is the 4.01 spelling, but with the key in place of the URL - see {@link QBinding}.
 */
const BINDING_PROP = "@id";

function isBinding(value: any): value is Record<typeof BINDING_PROP, any> {
  return !!value && typeof value === "object" && !Array.isArray(value) && BINDING_PROP in value;
}

/**
 * Writes a navigation property which may carry bindings to already existing entities, deep insert
 * payloads, or - for a collection valued property - both at once.
 *
 * Where the notation keeps a binding apart from the payload (4.0: {@code "Nav@odata.bind"}), a mixed
 * collection ends up as two properties; the other notations state both under the name of the navigation
 * property itself and therefore keep the order of the given array.
 */
function convertNavProp(
  collector: Record<string, any>,
  odataName: string,
  value: any,
  entity: QueryObject,
  binding: QBinding<any>,
) {
  // null clears the link, which is the one operation that has no payload counterpart
  if (value === null || value === undefined) {
    collector[binding.getKey(odataName)] = value;
    return;
  }

  // some V2 services expect collections wrapped in an extra results object, see issue #237
  const wrapped = !Array.isArray(value) && typeof value === "object" && Array.isArray(value.results);
  const items: Array<any> | undefined = Array.isArray(value) ? value : wrapped ? value.results : undefined;

  if (!items) {
    if (isBinding(value)) {
      collector[binding.getKey(odataName)] = binding.format(value[BINDING_PROP]);
    } else {
      collector[odataName] = entity.convertToOData(value);
    }
    return;
  }

  const rewrap = (list: Array<any>) => (wrapped ? { results: list } : list);
  const bindingKey = binding.getKey(odataName);

  if (bindingKey === odataName) {
    collector[odataName] = rewrap(
      items.map((item) => (isBinding(item) ? binding.format(item[BINDING_PROP]) : entity.convertToOData(item))),
    );
    return;
  }

  const payloads = items.filter((item) => !isBinding(item));
  const bindings = items.filter(isBinding);

  if (bindings.length) {
    collector[bindingKey] = bindings.map((item) => binding.format(item[BINDING_PROP]));
  }
  // an empty array is meaningful on its own, so it is only dropped when the bindings took its place
  if (payloads.length || !bindings.length) {
    collector[odataName] = rewrap(payloads.map((item) => entity.convertToOData(item)));
  }
}

/**
 * What joins a flattened complex property to its leaves. SAP CAP uses the underscore and that is the only
 * spelling in the field, hence it is fixed rather than configurable.
 *
 * Lives here rather than with {@link QFlatComplexPath} so that the dependency between the two runs one way
 * only: the path knows the query object, not the other way round.
 */
export const FLAT_SEPARATOR = "_";

/**
 * A complex property which the service states flat, i.e. as one property per leaf joined by
 * {@link FLAT_SEPARATOR}. Such a property owns several keys of the payload instead of one.
 */
function isFlatComplex(prop: any): prop is QEntityPathModel<QueryObject> {
  return prop?.discriminator === "FlatComplexType";
}

/**
 * Every path a flattened complex property occupies, which is what addressing the property as a whole comes
 * down to: it has no representation of its own, neither in a payload nor in a query, so selecting it means
 * selecting its leaves and clearing it means nulling them.
 */
export function flatLeafPaths(entity: QueryObject): Array<string> {
  const result: Array<string> = [];
  for (const key in entity) {
    // @ts-ignore - getters live on the prototype, hence the for-in loop
    const prop = entity[key];
    if (typeof prop?.getPath !== "function") {
      continue;
    }
    if (isFlatComplex(prop)) {
      result.push(...flatLeafPaths(prop.getEntity(true)));
    } else if (typeof prop.getEntity !== "function") {
      result.push(prop.getPath());
    }
    // anything else reached from here - a navigation property, a collection - is not a leaf of this
    // property: it is addressed in its own right and needs an $expand rather than a path
  }
  return result;
}

export const ENUMERABLE_PROP_DEFINITION = { enumerable: true };

export class QueryObject<T extends object = any> implements QueryObjectModel<T> {
  private __propMapping?: Map<string, string>;
  protected readonly __subtypeMapping?: Record<string, string>;

  /**
   * @param __prefix the path this query object is reached by, if it is a nested one
   * @param __separator what joins that prefix to the paths of the own properties. The slash of OData by
   *   default; an underscore where the service flattened this complex type into the entity carrying it,
   *   so `Address/City` is stated as the `Address_City` such a service actually knows. Set by
   *   {@link QFlatComplexPath}, never by generated code.
   */
  constructor(
    private __prefix?: string,
    private __separator: string = "/",
  ) {}

  private __getPropMapping(): Map<string, string> {
    if (!this.__propMapping) {
      this.__propMapping = getMapping(this);
    }
    return this.__propMapping;
  }

  /**
   * Adds the prefix of this QueryObject including its separator in front of the given path.
   * Only applies, if this QueryObject has a prefix.
   *
   * @param path the path to be prefixed
   * @protected
   */
  protected withPrefix(path: string) {
    return this.__prefix ? `${this.__prefix}${this.__separator}${path}` : path;
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
  public convertFromOData(odataModel: object): T | Array<T>;
  // public convertFromOData(odataModel: Array<object>): Array<PartialDeep<T>>;
  public convertFromOData(odataModel: FlexibleConversionModel<any>): FlexibleConversionModel<T> {
    if (odataModel === null || odataModel === undefined) {
      return odataModel;
    }
    if (typeof odataModel !== "object") {
      throw new Error("The model must be an object!");
    }

    const isList = Array.isArray(odataModel);
    const models = isList ? (odataModel as Array<T>) : [odataModel];

    const result = models.map((model) => {
      const typeByCi = getTypeControlInfo(model);
      // a flattened complex property owns several keys of the payload, so its value is assembled from all
      // of them and can only be converted once the whole model has been walked
      const flatBuckets = new Map<string, Record<string, any>>();

      const converted = Object.entries(model).reduce((collector, [key, value]) => {
        let propKey = this.__getPropMapping().get(key);
        let finalKey: string = propKey as string;

        if (typeByCi) {
          const newPropKey = this.__getPropMapping().get(`${typeByCi}/${key}`);
          if (newPropKey && typeof this.__subtypeMapping !== "undefined") {
            propKey = newPropKey;
            finalKey = (newPropKey as string).replace(new RegExp(`^${this.__subtypeMapping[typeByCi]}_`), "");
          }
        }
        const prop = propKey ? (this[propKey as keyof this] as unknown as QValuePathModel) : undefined;
        if (prop && finalKey) {
          // complex props
          const asComplexType = prop as QEntityPathModel<any>;
          if (typeof asComplexType.getEntity === "function") {
            // V2 wraps collection valued attributes into an extra results object (#125). The structure is
            // handed on as the service sent it - stating it is the job of v2ResponseResultsWrapping - but
            // the entities inside of it still need to be converted.
            const wrappedValue = value as unknown as { results: Array<object> };
            const isWrapped =
              asComplexType.isCollectionType() &&
              !!wrappedValue &&
              typeof wrappedValue === "object" &&
              Array.isArray(wrappedValue.results);

            const entity = asComplexType.getEntity();
            collector[finalKey] = isWrapped
              ? { results: entity.convertFromOData(wrappedValue.results) }
              : entity.convertFromOData(value);
          }
          // primitive props
          else {
            collector[finalKey] = prop.converter ? prop.converter.convertFrom(value) : value;
          }
        }
        // be permissive here to allow passing unknown values as they are
        else {
          const flat = this.__findFlatComplexProp(key);
          if (flat) {
            const bucket = flatBuckets.get(flat.propKey) ?? {};
            bucket[key.substring(flat.path.length + FLAT_SEPARATOR.length)] = value;
            flatBuckets.set(flat.propKey, bucket);
          } else {
            collector[key] = value;
          }
        }

        return collector;
      }, {} as any) as T;

      for (const [propKey, bucket] of flatBuckets) {
        const prop = this[propKey as keyof this] as unknown as QEntityPathModel<any>;
        // the entity is built without a prefix, so it reads the leaves by their bare names - and takes any
        // nesting of its own apart in turn
        (converted as any)[propKey] = prop.getEntity().convertFromOData(bucket);
      }

      return converted;
    });

    return isList ? result : result[0];
  }

  /**
   * The flattened complex property a payload key belongs to, if any: `Address_City` belongs to `Address`.
   * The longest match wins, so a nested group is preferred over the one enclosing it.
   */
  private __findFlatComplexProp(key: string): { propKey: string; path: string } | undefined {
    let match: { propKey: string; path: string } | undefined;

    for (const [path, propKey] of this.__getPropMapping()) {
      if (
        key.startsWith(`${path}${FLAT_SEPARATOR}`) &&
        isFlatComplex(this[propKey as keyof this]) &&
        (!match || path.length > match.path.length)
      ) {
        match = { propKey, path };
      }
    }

    return match;
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
  public convertToOData(userModel: T, failForUnknownProps?: boolean): object;
  public convertToOData(userModel: Array<T>, failForUnknownProps?: boolean): Array<object>;
  public convertToOData(userModel: T | Array<T> | null | undefined, failForUnknownProps = false) {
    if (userModel === null || userModel === undefined) {
      return userModel;
    }
    if (typeof userModel !== "object") {
      throw new Error("The model must be an object!");
    }

    const isList = Array.isArray(userModel);
    const models = isList ? userModel : [userModel];

    const result = models.map((model) => {
      const typeByCi = getTypeControlInfo(model);
      return Object.entries(model).reduce((collector, [key, value]) => {
        let prop = this[key as keyof this] as unknown as QValuePathModel | undefined;
        let finalKey = prop?.getPath();
        if (typeByCi && typeof this.__subtypeMapping !== "undefined") {
          const qName = this.__subtypeMapping[typeByCi];
          const subProp = this[`${qName}_${key}` as keyof this] as unknown as QValuePathModel | undefined;
          if (subProp) {
            prop = subProp;
            finalKey = subProp.getPath().replace(new RegExp(`^${typeByCi}/`), "");
          }
        }
        const asEntity = prop as QEntityPathModel<any>;
        if (typeof asEntity?.getEntity === "function") {
          const entity = asEntity.getEntity();
          const binding = asEntity.getBinding?.();
          if (isFlatComplex(asEntity)) {
            // the service knows no property of this name, only its leaves - so the converted object is
            // spread into the payload instead of nested into it
            if (value === null || value === undefined) {
              flatLeafPaths(asEntity.getEntity(true)).forEach((leaf) => (collector[leaf] = value));
            } else {
              Object.entries(entity.convertToOData(value, failForUnknownProps)).forEach(
                ([leafKey, leafValue]) => (collector[`${finalKey}${FLAT_SEPARATOR}${leafKey}`] = leafValue),
              );
            }
          } else if (binding) {
            convertNavProp(collector, finalKey!, value, entity, binding);
          } else {
            collector[finalKey!] = entity.convertToOData(value);
          }
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
