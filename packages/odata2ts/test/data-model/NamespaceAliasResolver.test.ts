import { describe, expect, test } from "vitest";
import { NamespaceWithAlias } from "../../src/data-model/DataModel.js";
import { resolveNamespaceAliases } from "../../src/data-model/NamespaceAliasResolver.js";

describe("resolveNamespaceAliases", () => {
  test("a namespace neither the server nor the project aliases has no effective alias", () => {
    const namespaces: Array<NamespaceWithAlias> = [["Library.Catalog"], ["Library.Circulation"]];
    expect(resolveNamespaceAliases(namespaces, undefined)).toEqual({});
  });

  describe("precedence", () => {
    test("a server-declared alias always wins over a project-configured one attempting the same namespace", () => {
      const namespaces: Array<NamespaceWithAlias> = [["Library.Catalog", "Srv"]];
      expect(() => resolveNamespaceAliases(namespaces, { alias: { "Library.Catalog": "Cat" } })).toThrow(
        /already declares alias/,
      );
    });

    test("a project-configured alias fills a namespace the server left unaliased", () => {
      const namespaces: Array<NamespaceWithAlias> = [["Library.Catalog"]];
      expect(resolveNamespaceAliases(namespaces, { alias: { "Library.Catalog": "Cat" } })).toEqual({
        "Library.Catalog": "Cat",
      });
    });

    test("a server-declared alias for one namespace and a project-configured one for another both take effect", () => {
      const namespaces: Array<NamespaceWithAlias> = [["Library.Catalog", "Cat"], ["Library.Circulation"]];
      expect(resolveNamespaceAliases(namespaces, { alias: { "Library.Circulation": "Circ" } })).toEqual({
        "Library.Catalog": "Cat",
        "Library.Circulation": "Circ",
      });
    });
  });

  describe("validation", () => {
    test("alias names a namespace the digested metadata does not contain", () => {
      const namespaces: Array<NamespaceWithAlias> = [["Library.Catalog"]];
      expect(() => resolveNamespaceAliases(namespaces, { alias: { Typo: "T" } })).toThrow(
        /does not contain that namespace/,
      );
    });

    test("alias names a namespace the server already aliases", () => {
      const namespaces: Array<NamespaceWithAlias> = [["Library.Catalog", "Srv"]];
      expect(() => resolveNamespaceAliases(namespaces, { alias: { "Library.Catalog": "Cat" } })).toThrow(
        /already declares alias "Srv"/,
      );
    });

    test("two namespaces resolving to the same alias where at least one side is server-declared or project-configured", () => {
      const namespaces: Array<NamespaceWithAlias> = [["Library.Catalog", "Cat"], ["Library.Circulation"]];
      expect(() => resolveNamespaceAliases(namespaces, { alias: { "Library.Circulation": "Cat" } })).toThrow(
        /both resolve to the same alias "Cat"/,
      );
    });

    test("two server-declared aliases colliding with each other is a hard error too", () => {
      const namespaces: Array<NamespaceWithAlias> = [
        ["Library.Catalog", "Cat"],
        ["Library.Circulation", "Cat"],
      ];
      expect(() => resolveNamespaceAliases(namespaces, undefined)).toThrow(/both resolve to the same alias "Cat"/);
    });

    test("a server-declared alias colliding with a real namespace name elsewhere in the service", () => {
      const namespaces: Array<NamespaceWithAlias> = [["Library.Catalog", "Circulation"], ["Circulation"]];
      expect(() => resolveNamespaceAliases(namespaces, undefined)).toThrow(/is itself the real name of another/);
    });

    test("a project-configured alias colliding with a real namespace name elsewhere in the service", () => {
      const namespaces: Array<NamespaceWithAlias> = [["Library.Catalog"], ["Circulation"]];
      expect(() => resolveNamespaceAliases(namespaces, { alias: { "Library.Catalog": "Circulation" } })).toThrow(
        /is itself the real name of another/,
      );
    });

    test("an alias value that is not a valid CSDL SimpleIdentifier", () => {
      const namespaces: Array<NamespaceWithAlias> = [["Library.Catalog"]];
      expect(() => resolveNamespaceAliases(namespaces, { alias: { "Library.Catalog": "Not.Valid" } })).toThrow(
        /not a valid alias/,
      );
      expect(() => resolveNamespaceAliases(namespaces, { alias: { "Library.Catalog": "1Bad" } })).toThrow(
        /not a valid alias/,
      );
    });

    test("the empty string is explicitly allowed as an alias value", () => {
      const namespaces: Array<NamespaceWithAlias> = [["Library.Catalog"]];
      expect(resolveNamespaceAliases(namespaces, { alias: { "Library.Catalog": "" } })).toEqual({
        "Library.Catalog": "",
      });
    });

    test("an alias equal to its own namespace's name is not a self-collision", () => {
      const namespaces: Array<NamespaceWithAlias> = [["PublisherRegistry", "PublisherRegistry"]];
      expect(() => resolveNamespaceAliases(namespaces, undefined)).not.toThrow();
    });
  });
});
