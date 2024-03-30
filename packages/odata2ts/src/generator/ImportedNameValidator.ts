export class ImportedNameValidator {
  private importedNames = new Map<string, Array<string>>();

  public validateName(qualifier: string, name: string): string {
    const qualifiers = this.importedNames.get(name) ?? [];
    const hitIndex = qualifiers.findIndex((q) => q === qualifier);

    let result = name;
    if (qualifiers.length && hitIndex !== 0) {
      const position = hitIndex > 0 ? hitIndex + 1 : qualifiers.length;
      result = `${name}_${position}`;
    }
    if (hitIndex < 0) {
      qualifiers.push(qualifier);
    }
    this.importedNames.set(name, qualifiers);
    return result;
  }
}
