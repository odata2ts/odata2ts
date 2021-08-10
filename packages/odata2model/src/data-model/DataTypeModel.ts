export const enum DataTypes {
  PrimitiveType = "PrimitiveType",
  EnumType = "EnumType",
  ModelType = "ModelType",
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
