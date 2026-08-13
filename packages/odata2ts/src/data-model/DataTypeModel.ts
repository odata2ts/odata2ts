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
  members: Array<{ name: string; value: number }>;
  /**
   * `IsFlags="true"`: the members are bits and may be combined. The one thing that follows for the
   * generated code is the `has` operator, which only the flags query paths offer.
   */
  isFlags: boolean;
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
