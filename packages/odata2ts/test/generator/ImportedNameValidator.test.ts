import { describe, expect, test } from "vitest";
import { ImportedNameValidator } from "../../src/generator/ImportedNameValidator.js";

describe("ImportedNameValidator tests", () => {
  test("first registration of a name returns it unchanged", () => {
    const validator = new ImportedNameValidator();

    expect(validator.validateName("moduleA", "Foo")).toBe("Foo");
  });

  test("same qualifier and name returns the cached result", () => {
    const validator = new ImportedNameValidator();

    validator.validateName("moduleA", "Foo");

    expect(validator.validateName("moduleA", "Foo")).toBe("Foo");
  });

  test("same name from a different qualifier gets a suffixed alias", () => {
    const validator = new ImportedNameValidator();

    validator.validateName("moduleA", "Foo");

    expect(validator.validateName("moduleB", "Foo")).toBe("Foo_1");
  });

  test("reserved names are pre-registered and get suffixed on first real use", () => {
    const validator = new ImportedNameValidator(["Foo"]);

    expect(validator.validateName("moduleA", "Foo")).toBe("Foo_1");
  });
});
