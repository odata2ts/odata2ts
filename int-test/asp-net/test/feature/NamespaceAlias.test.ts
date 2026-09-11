import { touchesResource } from "@odata2ts/odata-service";
import { afterAll, describe, expect, test } from "vitest";
import { BOOK_DER_PROZESS, LIBRARY_NAMESPACE_ALIAS } from "../LibraryTestConstants.js";

/** A copy only this file touches, so a re-run against the same server does not collide. */
const NAMESPACE_ALIAS_COPY = 8901;

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

  test("a $expand query and a write to the expanded set carry one and the same namespaced name - the matching pair touchesResource finds", async () => {
    // the whole point of cacheKeys.namespace reaching the binding's generator-supplied cache-key name: the
    // $expand's hop-shaped entry and the write's own rule-3 invalidation must carry the same prefixed name,
    // or a write to the expanded set can never invalidate a cached expanded query (issue #536, gap 1).
    // "Copies" is a navigation property of Medium (Library.Catalog), but it binds to the Copies entity set,
    // whose type lives in Library.Circulation - so both the expand slot and the write's entry are prefixed
    // with the *target* namespace's alias, Circulation.
    const copyKey = { MediumId: BOOK_DER_PROZESS, InventoryNumber: NAMESPACE_ALIAS_COPY };
    const created = await LIBRARY_NAMESPACE_ALIAS.Copies()
      .create({
        MediumId: BOOK_DER_PROZESS,
        InventoryNumber: NAMESPACE_ALIAS_COPY,
        Condition: 3,
        IsLoanable: true,
        WeightKg: 0.5,
      })
      .execute();
    expect(created.status).toBe(201);

    try {
      const request = LIBRARY_NAMESPACE_ALIAS.Media(BOOK_DER_PROZESS).query((builder) => builder.expand("Copies"));
      // the expand slot carries the target's namespaced entity-set name, not the bare navigation-property name
      // and not the raw (unprefixed) entity-set name; the route root keeps the source type's alias
      expect(request.cacheKey).toEqual([
        "Catalog.Media",
        "detail",
        BOOK_DER_PROZESS,
        { expand: [["Circulation.Copies", "list"]], query: "%24expand=Copies" },
      ]);

      const result = await request.execute();
      expect(result.status).toBe(200);

      const patched = await LIBRARY_NAMESPACE_ALIAS.Copies(copyKey).patch({ Condition: 4 }).ignoreETag().execute();
      expect(patched.status).toBe(204);
      // the write's own entries are namespaced too - one and the same name as the expand slot
      expect(patched.invalidates).toEqual(
        expect.arrayContaining([
          ["Circulation.Copies", "detail", copyKey],
          ["Circulation.Copies", "list"],
        ]),
      );

      // the matching pair: the write's namespaced invalidation finds the query's namespaced expand slot
      expect(touchesResource(["Circulation.Copies", "list"], request.cacheKey!)).toBe(true);
    } finally {
      await LIBRARY_NAMESPACE_ALIAS.Copies(copyKey).delete().ignoreETag().execute();
    }
  });

  test("a deep-insert write's own rule-5 entry and a $expand of that set carry one and the same namespaced name", async () => {
    // the same matching pair, one step further up: rule 5 (deep-edit) names the deep-inserted set the same
    // way rule 3 and the $expand slot do - the binding's generator-supplied cache-key name. A deep-inserted
    // Loan must invalidate a cached $expand=Loans query, and only a shared, prefixed name makes that match.
    const created = await LIBRARY_NAMESPACE_ALIAS.Members()
      .create({
        Name: "NamespaceAlias deep-insert",
        PreviousAddresses: [],
        Loans: [{ LoanedAt: "2026-05-01T10:00:00Z", DueDate: "2026-06-01" }],
      })
      .execute();
    expect(created.status).toBe(201);
    const memberId = created.data.Id;

    try {
      // the deep-inserted Loan contributes its own bare, namespaced entity-set entry (rule 5), in addition
      // to the write's own (rule 3)
      expect(created.invalidates).toEqual([
        ["Circulation.Members", "list"],
        ["Circulation.Loans", "list"],
      ]);

      const request = LIBRARY_NAMESPACE_ALIAS.Members(memberId).query((builder) => builder.expand("Loans"));
      expect(request.cacheKey).toEqual([
        "Circulation.Members",
        "detail",
        memberId,
        { expand: [["Circulation.Loans", "list"]], query: "%24expand=Loans" },
      ]);

      const result = await request.execute();
      expect(result.status).toBe(200);

      // the matching pair: the deep-insert's namespaced rule-5 entry finds the query's namespaced expand slot
      expect(touchesResource(["Circulation.Loans", "list"], request.cacheKey!)).toBe(true);
    } finally {
      await LIBRARY_NAMESPACE_ALIAS.Members(memberId).delete().execute();
    }
  });

  test("PublisherRegistry's project-configured alias has no cast or bound operation to prove itself through a cache-key literal - useAliasForFolderName is what proves it instead: this very import only resolves if the generated folder is really named `pub`, not `publisher-registry`", async () => {
    const { QBranch } = await import("../../src-generated/library-namespace-alias/pub/branch/QBranch.js");
    expect(new QBranch()).toBeInstanceOf(QBranch);
  });
});
