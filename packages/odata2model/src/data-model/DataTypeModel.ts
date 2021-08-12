export const enum DataTypes {
  PrimitiveType = "PrimitiveType",
  EnumType = "EnumType",
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
  type: string;
  required: boolean;
  isCollection: boolean;
  dataType: DataTypes;
}

export interface ModelType {
  odataName: string;
  name: string;
  props: Array<PropertyModel>;
  baseClasses: Array<string>;
}

export interface EnumType {
  odataName: string;
  name: string;
  members: Array<string>;
}

export interface OperationType {
  odataName: string;
  name: string;
  type: OperationTypes;
  parameters: Array<PropertyModel>;
  returnType?: ReturnTypeModel;
}

export interface ReturnTypeModel {
  odataType: string;
  type: string;
}

export type EntityContainerModel = {
  entitySets: { [name: string]: EntitySetType };
  singletons: { [name: string]: SingletonType };
  functions: { [name: string]: FunctionImportType };
  actions: { [name: string]: ActionImportType };
};

export interface SingletonType {
  odataName: string;
  name: string;
  type: ModelType;
}

export interface EntitySetType {
  odataName: string;
  name: string;
  entityType: ModelType;
  navPropBinding: Array<NavPropBindingType>;
}

export interface NavPropBindingType {
  path: string;
  target: string;
}

export interface ActionImportType {
  odataName: string;
  name: string;
  operation: OperationType;
}

export interface FunctionImportType extends ActionImportType {
  entitySet: string;
}
