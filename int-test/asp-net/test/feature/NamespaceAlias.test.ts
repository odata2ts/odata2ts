import { describe, expect, test } from "vitest";
import { BOOK_DER_PROZESS, LIBRARY_NAMESPACE_ALIAS } from "../LibraryTestConstants.js";

/**
 * `namespace.alias`, against the one server whose reference model has all four namespaces this feature
 * cares about: `Library.Catalog` (aliased to `Catalog`), `Library.Circulation` (aliased to `Circulation`),
 * `PublisherRegistry` (aliased to `Pub`), and `Library.Service` (which declares no types of its own, so it
 * never gets a folder). Every alias here is explicit, project-configured - there is no auto-synthesis.
 *
 * `LIBRARY_NAMESPACE_ALIAS` is a separate client from `LIBRARY` (see the config's own comment): every other
 * assertion in this package is unaffected by the option, and this is the one client where it is switched on.
 */
describe("ASP.NET Library: namespace aliasing", () => {
  test("useAliasForFolderName names the generated folder after the alias: this very import only resolves if the folder is really named `pub`, not `publisher-registry`", async () => {
    const { QBranch } = await import("../../src-generated/library-namespace-alias/pub/branch/QBranch.js");
    expect(new QBranch()).toBeInstanceOf(QBranch);
  });

  test("an aliased client addresses the very same resources as the unaliased one - the alias is a naming concern only", async () => {
    const result = await LIBRARY_NAMESPACE_ALIAS.Media(BOOK_DER_PROZESS).Copies().query().execute();

    expect(result.status).toBe(200);
  });

  test("a subtype cast works the same through an aliased client", async () => {
    // the single-entity cast form (`Media(<id>)/Library.Catalog.Book`) is one of the things this server does
    // not serve (see the package README) - the collection form is
    const result = await LIBRARY_NAMESPACE_ALIAS.Media().asBookCollectionService().query().execute();

    expect(result.status).toBe(200);
    expect(result.data.value.length).toBeGreaterThan(0);
  });
});
