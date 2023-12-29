import { ConfigFileOptions } from "../../OptionModel";
import { TypeModel } from "../../TypeModel";

export interface ValidationError {
  fqName: string;
  type: TypeModel;
  renamedTo?: string;
}

export interface NameValidatorOptions extends Pick<ConfigFileOptions, "disableAutomaticNameClashResolution"> {}

export class NameValidator {
  private store = new Map<string, ValidationError>();
  private errors = new Map<string, ValidationError[]>();

  constructor(private options: NameValidatorOptions = {}) {}

  private add(fqName: string, name: string, type: TypeModel) {
    const validationObject: ValidationError = { type, fqName };
    const hit = this.store.get(name);
    if (hit) {
      const existingErrors = this.errors.get(name);
      if (existingErrors) {
        if (!this.options.disableAutomaticNameClashResolution) {
          validationObject.renamedTo = `${name}${existingErrors.length + 1}`;
        }
        existingErrors.push(validationObject);
        return validationObject.renamedTo ?? name;
      } else {
        if (!this.options.disableAutomaticNameClashResolution) {
          validationObject.renamedTo = `${name}2`;
        }
        this.errors.set(name, [hit, validationObject]);
        return validationObject.renamedTo ?? name;
      }
    } else {
      this.store.set(name, validationObject);
      return name;
    }
  }

  public addEntityType(fqName: string, name: string) {
    return this.add(fqName, name, TypeModel.EntityType);
  }
  public addComplexType(fqName: string, name: string) {
    return this.add(fqName, name, TypeModel.ComplexType);
  }
  public addEnumType(fqName: string, name: string) {
    return this.add(fqName, name, TypeModel.EnumType);
  }
  public addOperationType(fqName: string, name: string) {
    return this.add(fqName, name, TypeModel.OperationType);
  }

  public validate() {
    return this.errors;
  }
}
