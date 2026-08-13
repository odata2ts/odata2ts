import { ValueConverterImport } from "@odata2ts/converter-runtime";
import { ManagedState, Modes } from "../OptionModel.js";

export enum ODataVersion {
  V2 = "2.0",
  V4 = "4.0",
}

export const enum DataTypes {
  PrimitiveType = "PrimitiveType",
  EnumType = "EnumType",
  ComplexType = "ComplexType",
  ModelType = "ModelType",
}

export const enum OperationTypes {
  Function = "Function",
  Action = "Action",
}

export interface PropertyModel {
  odataName: string;
  name: string;
  odataType: string;
  fqType: string;
  type: string;
  typeModule?: string;
  qObject?: string;
  qPath: string;
  qParam?: string;
  required: boolean;
  isCollection: boolean;
  dataType: DataTypes;
  converters?: Array<ValueConverterImport>;
  /**
   * In which way the server manages this property, which decides where it shows up: a property the client
   * may not write is absent from the editable model, one it may not read from the model itself.
   *
   * Undefined means that nobody has spoken: neither the configuration, nor an annotation of the service,
   * nor the key detection. That is different from {@link ManagedState.off}, which is the explicit
   * statement that the property is not managed.
   */
  managed?: ManagedState;
  /**
   * An `Edm.Stream` property: binary content which never travels in the entity's JSON payload, but is
   * addressed by its own URL. Such a property is therefore absent from the models and the q-object and
   * gets its own service instead.
   */
  isStream?: boolean;
}

export type ModelType = EntityType | ComplexType | EnumType;

export interface EntityType extends ComplexType {
  id: {
    // fully qualified name of entity to which this id belongs (might have been inherited)
    fqName: string;
    // that's the name of the param model for the id function
    modelName: string;
    // that's the name of the id function which is a q-object
    qName: string;
  };
  generateId: boolean;
  keyNames: Array<string>;
  keys: Array<PropertyModel>;
  getKeyUnion(): string;
  /**
   * Media entity (`HasStream="true"`): the entity's own representation is binary content, reachable by
   * appending `$value` to its URL. Inherited from base types.
   */
  hasStream: boolean;
}

export interface ComplexType {
  dataType: DataTypes;
  fqName: string;
  odataName: string;
  name: string;
  modelName: string;
  editableName: string;
  qName: string;
  qBaseName?: string;
  serviceName: string;
  serviceCollectionName: string;
  folderPath: string;
  props: Array<PropertyModel>;
  baseProps: Array<PropertyModel>;
  baseClasses: Array<string>;
  finalBaseClass: string | undefined;
  abstract: boolean;
  open: boolean;
  genMode: Modes;
  subtypes: Set<string>;
}

export interface EnumType {
  dataType: DataTypes;
  odataName: string;
  fqName: string;
  name: string;
  modelName: string;
  folderPath: string;
  members: Array<{ name: string; value: number | string }>;
  /**
   * `IsFlags="true"`: the members are bits and may be combined. The one thing that follows for the
   * generated code is the `has` operator, which only the flags query paths offer.
   */
  isFlags: boolean;
  /**
   * The primitive type the values of this enum travel as - set only for an enum the service never
   * declared, derived from `Validation.AllowedValues` instead.
   *
   * A declared enum puts the *name* of a member on the wire, so model and service agree without further
   * ado. Here the property kept its primitive type and the members are symbolic names the service has
   * never heard of, so the value behind a name is what has to be sent and received.
   */
  wireType?: string;
}

/**
 * Whether the members of an enum can be generated as the numbers they stand for.
 *
 * A declared enum always can, since it numbers its members. One derived from `Validation.AllowedValues`
 * takes its values from the annotation instead, and those may be genuine strings, which no numeric enum
 * can carry.
 */
export function hasNumericMembers(enumType: EnumType): boolean {
  return enumType.members.every((mem) => typeof mem.value === "number");
}

/**
 * Whether an enum needs a converter between its members and what the service transmits for them.
 *
 * Only an enum derived from `Validation.AllowedValues` ever does - a declared one puts the name of a
 * member on the wire, which is what the query objects assume without further ado. And even a derived one
 * does not where each value is spelled exactly like the name it stands for, which leaves nothing to
 * convert and nothing to format differently.
 */
export function needsEnumConverter(enumType: EnumType): boolean {
  return !!enumType.wireType && enumType.members.some((mem) => mem.value !== mem.name);
}

export interface OperationType {
  fqName: string;
  odataName: string;
  name: string;
  qName: string;
  paramsModelName: string;
  type: OperationTypes;
  parameters: Array<PropertyModel>;
  returnType?: ReturnTypeModel;
  usePost?: boolean;
  overrides?: Array<Array<PropertyModel>>;
  composable?: boolean;
}

export interface ReturnTypeModel extends PropertyModel {}

export type EntityContainerModel = {
  entitySets: { [name: string]: EntitySetType };
  singletons: { [name: string]: SingletonType };
  functions: { [name: string]: FunctionImportType };
  actions: { [name: string]: ActionImportType };
};

export interface SingletonType {
  fqName: string;
  odataName: string;
  name: string;
  entityType: EntityType;
  navPropBinding?: Array<NavPropBindingType>;
}

export interface EntitySetType {
  fqName: string;
  odataName: string;
  name: string;
  entityType: EntityType;
  navPropBinding?: Array<NavPropBindingType>;
}

export interface NavPropBindingType {
  path: string;
  target: string;
}

export interface ActionImportType {
  fqName: string;
  odataName: string;
  name: string;
  operation: string;
}

export interface FunctionImportType extends ActionImportType {
  entitySet: string;
}
