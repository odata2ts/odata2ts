import { afterAll, describe, expect, test } from "vitest";
import { BOOK_DER_PROZESS, LIBRARY_NAMESPACE_ALIAS } from "../LibraryTestConstants.js";

/**
 * `namespace.alias` and `cacheKeys.namespace`, against the one server whose reference model has all four
 * namespaces this feature cares about: `Library.Catalog` (aliased to `Catalog`), `Library.Circulation`
 * (aliased to `Circulation`), `PublisherRegistry` (aliased to `Pub`), and `Library.Service` (which declares
 * no types of its own, so it never gets a folder and carries no cache-key literal either). Every alias here
 * is explicit, project-configured - there is no auto-synthesis.
 *
 * `cacheKeys.namespace` shares this client rather than getting its own: it needs the exact same explicit
 * aliases to prove itself against a real service (an entity-set root's own name and every `entitySetName`
 * prefixed with the owning type's alias - see `OptionModel.ts`'s own doc comment on the option for the
 * "same HttpClient across several generated clients" use case this exists for).
 *
 * `LIBRARY_NAMESPACE_ALIAS` is a separate client from `LIBRARY` (see the config's own comment): every other
 * assertion in this package is unaffected by either option, and this is the one client where they are
 * switched on.
 */
describe("ASP.NET Library: namespace aliasing", () => {
  let memberId: number | undefined;

  afterAll(async () => {
    if (memberId !== undefined) {
      await LIBRARY_NAMESPACE_ALIAS.Members(memberId).delete().execute();
    }
  });

  test("a subtype cast's cache-key literal carries the configured alias, not the raw namespace - and cacheKeys.namespace prefixes the root itself the same way", async () => {
    // the single-entity cast form (`Media(<id>)/Library.Catalog.Book`) is one of the things this server does
    // not serve (see the package README) - the collection form is, and is all a cast's own cache-key literal
    // needs to prove out anyway
    const request = LIBRARY_NAMESPACE_ALIAS.Media().asBookCollectionService().query();
    expect(request.cacheKey).toEqual(["Catalog.Media", "list", { cast: "Catalog.Book" }]);

    const result = await request.execute();
    expect(result.status).toBe(200);
    expect(result.data.value.length).toBeGreaterThan(0);
  });

  test("a bound operation's cache-key literal carries the configured alias too - entitySetName included, wherever a hop attaches one", async () => {
    // OutstandingBalance is a bound *function* (GET, read-only) - unlike the bound actions on this same
    // entity, calling it has no side effect on data other tests depend on
    const created = await LIBRARY_NAMESPACE_ALIAS.Members()
      .create({ Name: "NamespaceAlias Test", PreviousAddresses: [] })
      .execute();
    expect(created.status).toBe(201);
    memberId = created.data.Id;

    const request = LIBRARY_NAMESPACE_ALIAS.Members(memberId).OutstandingBalance();
    expect(request.cacheKey).toEqual(["Circulation.Members", "detail", memberId, "Circulation.OutstandingBalance"]);

    const result = await request.execute();
    expect(result.status).toBe(200);
    expect(typeof result.data.value).toBe("number");
  });

  test("a hierarchical hop's own step name is never prefixed - only its entitySetName is", async () => {
    const request = LIBRARY_NAMESPACE_ALIAS.Media(BOOK_DER_PROZESS).Copies().query();
    expect(request.cacheKey).toEqual(["Catalog.Media", "detail", BOOK_DER_PROZESS, "Copies", "list"]);

    const result = await request.execute();
    expect(result.status).toBe(200);
  });

  test("PublisherRegistry's project-configured alias has no cast or bound operation to prove itself through a cache-key literal - useAliasForFolderName is what proves it instead: this very import only resolves if the generated folder is really named `pub`, not `publisher-registry`", async () => {
    const { QBranch } = await import("../../src-generated/library-namespace-alias/pub/branch/QBranch.js");
    expect(new QBranch()).toBeInstanceOf(QBranch);
  });
});
