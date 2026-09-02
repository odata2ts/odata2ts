import { touchesType } from "@odata2ts/odata-service";
import { describe, expect, test } from "vitest";
import { CONVERTED } from "../LibraryConvertedConstants.js";
import { BOOK_DER_PROZESS, COPY_KEY, LIBRARY } from "../LibraryTestConstants.js";

/**
 * `cacheKeys: { mode: "hierarchical" }`, against Apache Olingo - a native V2 server, the counterpart of
 * `int-test/cap`'s V2 *adapter* client. This is where `<Association>` digestion (`DataModelDigestionV2`)
 * is shown reaching the key end to end against a server that speaks V2 on the wire from the start, and
 * where a converted client's cache key meets a real server for the first time.
 *
 * `hierarchical` does not depend on the grade at all, so `Member/Loans` - `Partner` declared, no
 * `ReferentialConstraint`, exactly ASP.NET's grade B - and `Books/Copies` - `ReferentialConstraint`
 * declared, grade A - key the identical shape here. What this file actually exercises is that the
 * `entitySetType` reaches the hop at all: both relations still need `getNavPropBindingTarget`, which reads
 * the very same `<Association>`/`<AssociationSet>` digestion the grade resolver does.
 */
describe("Olingo Library: cache keys", () => {
  test("entityTypeName is the entity set's FQ type", () => {
    expect(LIBRARY.Books().entityTypeName).toBe("Library.Catalog.Book");
    expect(LIBRARY.Copies().entityTypeName).toBe("Library.Circulation.Copy");
  });

  test("<Association> digestion reaches the key: Books/Copies, a grade-A relation kept hierarchical", async () => {
    const request = LIBRARY.Books(BOOK_DER_PROZESS).Copies().query();
    expect(request.cacheKey).toEqual([
      "Library.Catalog.Book",
      "detail",
      BOOK_DER_PROZESS,
      "Library.Circulation.Copy",
      "list",
      "Copies",
    ]);

    const result = await request.execute();
    expect(result.status).toBe(200);
  });

  test("<Association> digestion reaches the key: Member/Loans, a grade-B relation kept hierarchical", () => {
    // Partner is declared on Member_Loans, but no ReferentialConstraint - the same shape ASP.NET's V4
    // client produces for the same relation, which is exactly the point: the mode, not the server's V2-ness
    // or its grade, decides this shape.
    const request = LIBRARY.Members(1).Loans().query();
    expect(request.cacheKey).toEqual([
      "Library.Circulation.Member",
      "detail",
      1,
      "Library.Circulation.Loan",
      "list",
      "Loans",
    ]);
  });

  test("a V2 filter literal is the typed value in the structured filter map, not the rendered $filter", () => {
    const request = LIBRARY.Copies().query((builder, qCopy) => builder.filter(qCopy.MediumId.eq(BOOK_DER_PROZESS)));

    // the rendered URL carries V2's own literal form...
    expect(decodeURIComponent(request.getUrl())).toContain(`MediumId eq guid'${BOOK_DER_PROZESS}'`);
    // ...but the cache key carries the bare typed value, exactly as a derived relation would produce it
    expect(request.cacheKey).toEqual(["Library.Circulation.Copy", "list", { filter: { MediumId: BOOK_DER_PROZESS } }]);
  });

  test("touchesType reaches a hierarchical key by type", () => {
    const key = LIBRARY.Books(BOOK_DER_PROZESS).Copies().query().cacheKey!;
    expect(touchesType("Library.Catalog.Book", key)).toBe(true);
    expect(touchesType("Library.Circulation.Copy", key)).toBe(true);
    expect(touchesType("Library.Circulation.Member", key)).toBe(false);
  });

  test("invalidates on a write", async () => {
    const patched = await LIBRARY.Copies(COPY_KEY).patch({ IsLoanable: false }).ignoreETag().execute();
    expect([200, 204]).toContain(patched.status);
    expect(patched.invalidates).toEqual([
      ["Library.Circulation.Copy", "detail", COPY_KEY],
      ["Library.Circulation.Copy", "list"],
    ]);

    // restore, so this test can re-run against the same server without changing what other suites see
    await LIBRARY.Copies(COPY_KEY).patch({ IsLoanable: true }).ignoreETag().execute();
  });

  /**
   * Decision 1 of the plan (`spec/odata2ts-cache-key.md`): a cache-key value is OData-side, pre-render -
   * `converter.convertTo(value)`, never the caller's own value. `int64ToBigIntConverter` is the reason it
   * was resolved that way: the caller's own value is a `bigint` (that is what `convertFrom` hands back),
   * and `JSON.stringify` refuses one - exactly what a TanStack Query cache does to hash a key. `convertTo`
   * turns it back into the wire string before the clause is recorded, which is what keeps the key
   * JSON-serialisable without odata2ts inventing a special case for this one converter.
   *
   * `LibraryConverted` is the one client that carries this converter, so this is the one place the
   * decision can be held against a real server rather than only a fixture with a hand-built converter.
   */
  test("a converted Int64 property yields a JSON-serialisable clause value", async () => {
    const request = CONVERTED.Branches().query((builder, qBranch) =>
      builder.filter(qBranch.Population.eq(BigInt(1841000))),
    );

    // the caller passed a bigint; the clause holds convertTo's own output, the wire string
    const filter = (request.cacheKey![2] as { filter: { Population: unknown } }).filter;
    expect(filter.Population).toBe("1841000");
    expect(typeof filter.Population).toBe("string");

    // the assertion that matters: this would throw if the caller's own bigint had reached the key instead
    expect(() => JSON.stringify(request.cacheKey)).not.toThrow();

    const result = await request.execute();
    expect(result.status).toBe(200);
  });
});
