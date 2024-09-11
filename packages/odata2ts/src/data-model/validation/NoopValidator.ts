import { OperationTypes } from "../DataTypeModel";
import { NameValidator, ValidationError } from "./NameValidator.js";

export class NoopValidator implements NameValidator {
  addComplexType(fqName: string, name: string): string {
    return name;
  }

  addEntitySet(fqName: string, name: string): string {
    return name;
  }

  addEntityType(fqName: string, name: string): string {
    return name;
  }

  addEnumType(fqName: string, name: string): string {
    return name;
  }

  addOperationImportType(fqName: string, name: string): string {
    return name;
  }

  addSingleton(fqName: string, name: string): string {
    return name;
  }

  addBoundOperationType(bindingName: string, fqName: string, name: string, operationType: OperationTypes): string {
    return name;
  }

  addUnboundOperationType(fqName: string, name: string, operationType: OperationTypes): string {
    return name;
  }

  validate(): Map<string, ValidationError[]> {
    return new Map();
  }
}
