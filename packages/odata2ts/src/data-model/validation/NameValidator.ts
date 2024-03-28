import { TypeModel } from "../../TypeModel";

export interface NameValidator {
  addToTypes(fqName: string, name: string, type: TypeModel): string;

  addEntityType(fqName: string, name: string): string;

  addComplexType(fqName: string, name: string): string;

  addEnumType(fqName: string, name: string): string;

  addUnboundOperationType(fqName: string, name: string): string;

  addBoundOperationType(bindingName: string, fqName: string, name: string): string;

  addToEntityContainer(fqName: string, name: string, type: TypeModel): string;

  addOperationImportType(fqName: string, name: string): string;

  addEntitySet(fqName: string, name: string): string;

  addSingleton(fqName: string, name: string): string;

  validate(): Map<string, ValidationError[]>;
}

export interface ValidationError {
  fqName: string;
  type: TypeModel;
  renamedTo?: string;
}
