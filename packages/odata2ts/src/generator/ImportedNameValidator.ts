export class ImportedNameValidator {
  private importedNames = new Map<string, Record<string, string>>();

  public constructor(reservedNames?: Array<string> | undefined) {
    reservedNames?.forEach((rn) => {
      this.importedNames.set(rn, { ["_"]: rn });
    });
  }

  public validateName(qualifier: string, name: string): string {
    const qualifiers = this.importedNames.get(name) ?? {};
    const hitName = qualifiers[qualifier];

    if (hitName) {
      return hitName;
    }

    const qualifiersSize = Object.keys(qualifiers).length;
    const result = qualifiersSize ? `${name}_${qualifiersSize}` : name;

    qualifiers[qualifier] = result;
    this.importedNames.set(name, qualifiers);

    return result;
  }
}
