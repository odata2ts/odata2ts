import { ValueConverterImport } from "@odata2ts/converter-runtime";

import { Modes } from "../OptionModel.js";

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
  managed?: boolean;
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
}

export interface ComplexType {
  dataType: DataTypes;
  fqName: string;
  odataName: string;
  name: string;
  modelName: string;
  editableName: string;
  qName: string;
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
}

export interface EnumType {
  dataType: DataTypes;
  odataName: string;
  fqName: string;
  name: string;
  modelName: string;
  folderPath: string;
  members: Array<string>;
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
