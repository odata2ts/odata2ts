import { ConfigFileOptions } from "../../OptionModel";
import { TypeModel } from "../../TypeModel";

export interface ValidationError {
  fqName: string;
  type: TypeModel;
  renamedTo?: string;
}

export interface NameValidatorOptions extends Pick<ConfigFileOptions, "disableAutomaticNameClashResolution"> {}

export class NameValidator {
  private entityContainer = new Map<string, ValidationError>();
  private store = new Map<string, ValidationError>();
  private errors = new Map<string, ValidationError[]>();

  constructor(private options: NameValidatorOptions = {}) {}

  private addToError(name: string, hit: ValidationError, validationObject: ValidationError) {
    const existingErrors = this.errors.get(name);
    if (existingErrors) {
      if (!this.options.disableAutomaticNameClashResolution) {
        validationObject.renamedTo = `${name}${existingErrors.length + 1}`;
      }
      existingErrors.push(validationObject);
    } else {
      if (!this.options.disableAutomaticNameClashResolution) {
        validationObject.renamedTo = `${name}2`;
      }
      this.errors.set(name, [hit, validationObject]);
    }
    return validationObject.renamedTo ?? name;
  }

  private addToTypes(fqName: string, name: string, type: TypeModel): string {
    const validationObject: ValidationError = { type, fqName };
    const hit = this.store.get(name);
    if (hit) {
      return this.addToError(name, hit, validationObject);
    } else {
      this.store.set(name, validationObject);
      return name;
    }
  }

  private addToEntityContainer(fqName: string, name: string, type: TypeModel): string {
    const validationObject: ValidationError = { type, fqName };
    const hit = this.entityContainer.get(name);
    if (hit) {
      return this.addToError(name, hit, validationObject);
    } else {
      this.entityContainer.set(name, validationObject);
      return name;
    }
  }

  public addEntityType(fqName: string, name: string) {
    return this.addToTypes(fqName, name, TypeModel.EntityType);
  }
  public addComplexType(fqName: string, name: string) {
    return this.addToTypes(fqName, name, TypeModel.ComplexType);
  }
  public addEnumType(fqName: string, name: string) {
    return this.addToTypes(fqName, name, TypeModel.EnumType);
  }
  public addUnboundOperationType(fqName: string, name: string) {
    return this.addToTypes(fqName, name, TypeModel.OperationType);
  }
  public addBoundOperationType(bindingName: string, fqName: string, name: string) {
    return this.addToTypes(`${bindingName}_${fqName}`, name, TypeModel.OperationType);
  }
  public addOperationImportType(fqName: string, name: string) {
    return this.addToEntityContainer(fqName, name, TypeModel.OperationImportType);
  }
  public addEntitySet(fqName: string, name: string) {
    return this.addToEntityContainer(fqName, name, TypeModel.EntitySet);
  }
  public addSingleton(fqName: string, name: string) {
    return this.addToEntityContainer(fqName, name, TypeModel.Singleton);
  }

  public validate() {
    return this.errors;
  }
}
