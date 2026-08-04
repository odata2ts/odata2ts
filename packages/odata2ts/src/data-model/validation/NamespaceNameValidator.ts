import { TypeModel } from "../../TypeModel.js";
import { OperationTypes } from "../DataTypeModel.js";
import { NameValidator, ValidationError } from "./NameValidator.js";

/**
 * Name validator for unbundled file generation, where every model gets a folder of its own.
 *
 * The same name in two different namespaces is unproblematic there - the folders keep the files apart and
 * the generated barrels re-export each namespace under its own name - so, unlike the bundled case, nothing
 * needs to be renamed automatically.
 *
 * Within a single namespace it is fatal, and it cannot happen by accident: OData already requires the names
 * of a schema's children to be unique, so a clash here always stems from renaming - a naming strategy
 * ({@code allowRenaming}) or an explicit {@code mappedName}. Only the user knows which of the two types
 * should keep the plain name, hence there is nothing to resolve automatically and this fails the run.
 */
export class NamespaceNameValidator implements NameValidator {
  private readonly types = new Map<string, string>();
  private readonly entityContainer = new Map<string, string>();

  private add(
    store: Map<string, string>,
    key: string,
    fqName: string,
    name: string,
    type: TypeModel,
    allowSameFqName = false,
  ): string {
    const lastDot = fqName.lastIndexOf(".");
    const namespace = lastDot < 0 ? "" : fqName.substring(0, lastDot);
    const namespacedKey = `${namespace}|${key}`;

    const clashingFqName = store.get(namespacedKey);
    if (clashingFqName !== undefined && !(allowSameFqName && clashingFqName === fqName)) {
      throw new Error(
        `Name clash in namespace "${namespace}": "${clashingFqName}" and "${fqName}" both result in the name "${name}"! ` +
          `Give one of them a name of its own, e.g. ` +
          `byTypeAndName: [{ name: "${fqName}", type: TypeModel.${type}, mappedName: "SomeOtherName" }].`,
      );
    }

    store.set(namespacedKey, fqName);
    return name;
  }

  addEntityType(fqName: string, name: string) {
    return this.add(this.types, name, fqName, name, TypeModel.EntityType);
  }

  addComplexType(fqName: string, name: string) {
    return this.add(this.types, name, fqName, name, TypeModel.ComplexType);
  }

  addEnumType(fqName: string, name: string) {
    return this.add(this.types, name, fqName, name, TypeModel.EnumType);
  }

  addUnboundOperationType(fqName: string, name: string, operationType: OperationTypes) {
    // functions may be overloaded, so the very same operation showing up again is not a clash
    const allowSameFqName = operationType !== OperationTypes.Action;
    return this.add(this.types, name, fqName, name, TypeModel.OperationType, allowSameFqName);
  }

  addBoundOperationType(bindingName: string, fqName: string, name: string, operationType: OperationTypes) {
    const allowSameFqName = operationType !== OperationTypes.Action;
    return this.add(this.types, `${bindingName}_${name}`, fqName, name, TypeModel.OperationType, allowSameFqName);
  }

  addOperationImportType(fqName: string, name: string) {
    return this.add(this.entityContainer, name, fqName, name, TypeModel.OperationImportType);
  }

  addEntitySet(fqName: string, name: string) {
    return this.add(this.entityContainer, name, fqName, name, TypeModel.EntitySet);
  }

  addSingleton(fqName: string, name: string) {
    return this.add(this.entityContainer, name, fqName, name, TypeModel.Singleton);
  }

  /**
   * Clashes fail the run right away, so there is never anything to report afterwards.
   */
  validate(): Map<string, Array<ValidationError>> {
    return new Map();
  }
}
