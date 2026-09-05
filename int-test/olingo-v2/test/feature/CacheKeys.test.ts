import { touchesResource } from "@odata2ts/odata-service";
import { describe, expect, test } from "vitest";
import { CONVERTED } from "../LibraryConvertedConstants.js";
import { BOOK_DER_PROZESS, COPY_KEY, LIBRARY } from "../LibraryTestConstants.js";

/**
 * `cacheKeys: { mode: "on" }`, against Apache Olingo - a native V2 server, the counterpart of
 * `int-test/cap`'s V2 *adapter* client. This is where a converted client's cache key meets a real server
 * for the first time, and where V2's own URL/filter-literal building is proven end to end.
 */
describe("Olingo Library: cache keys", () => {
  test("Books/Copies names itself by the navigation property - no entitySetName here, since this server's polymorphic, table-per-leaf-class layout leaves the target set unresolvable for this one relation", async () => {
    const request = LIBRARY.Books(BOOK_DER_PROZESS).Copies().query();
    expect(request.cacheKey).toEqual(["Books", "detail", BOOK_DER_PROZESS, "Copies", "list"]);

    const result = await request.execute();
    expect(result.status).toBe(200);
  });

  test("Members/Loans names itself by the navigation property, with a real entitySetName for response-observed identity", () => {
    const request = LIBRARY.Members(1).Loans().query();
    expect(request.cacheKey).toEqual(["Members", "detail", 1, "Loans", "list"]);
  });

  test("a read through a navigated route records the resource it served, so a later direct write to it also invalidates that route", async () => {
    const navigated = await LIBRARY.Members(1).Loans().query().execute();
    expect(navigated.status).toBe(200);
    const loan = navigated.data.d.results[0];

    try {
      // V2 has no `Prefer: return=representation` - a PUT/PATCH answers 204, no body to resolve identity
      // from, so this exercises `state.key` addressing the write's own resource, not the response body
      const patched = await LIBRARY.Loans(loan.Id).patch({ ReturnedAt: "/Date(1779408000000)/" }).execute();
      expect(patched.invalidates).toEqual(expect.arrayContaining([["Members", "detail", 1, "Loans", "list"]]));
    } finally {
      // restore, so this test can re-run against the same server without changing what other suites see
      await LIBRARY.Loans(loan.Id).patch({ ReturnedAt: loan.ReturnedAt }).execute();
    }
  });

  test("a V2 filter literal is the typed value in the structured filter map, not the rendered $filter", () => {
    const request = LIBRARY.Copies().query((builder, qCopy) => builder.filter(qCopy.MediumId.eq(BOOK_DER_PROZESS)));

    // the rendered URL carries V2's own literal form...
    expect(decodeURIComponent(request.getUrl())).toContain(`MediumId eq guid'${BOOK_DER_PROZESS}'`);
    // ...but the cache key carries the bare typed value
    expect(request.cacheKey).toEqual(["Copies", "list", { filter: { MediumId: BOOK_DER_PROZESS } }]);
  });

  test("touchesResource reaches a hierarchical key by its own name", () => {
    const key = LIBRARY.Members(1).Loans().query().cacheKey!;
    expect(touchesResource(["Members", "detail", 1], key)).toBe(true);
    expect(touchesResource(["Loans", "list"], key)).toBe(true);
    expect(touchesResource(["Copies", "list"], key)).toBe(false);
  });

  test("invalidates on a write", async () => {
    const patched = await LIBRARY.Copies(COPY_KEY).patch({ IsLoanable: false }).ignoreETag().execute();
    expect([200, 204]).toContain(patched.status);
    expect(patched.invalidates).toEqual([
      ["Copies", "detail", COPY_KEY],
      ["Copies", "list"],
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
