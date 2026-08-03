import { describe, expect, test } from "vitest";
import { expectODataError } from "../expectODataError.js";
import { BASE_URL, BOOK_DER_PROZESS, COPY_KEY, LIBRARY } from "../LibraryTestConstants.js";

/**
 * Parts of the generated service's own API that no other file here exercises: key handling, adding
 * query options to a command after the fact, and the select wildcard.
 *
 * None of them is server behaviour - they are the client's, and they would be equally true against any
 * V2 service. They are covered here because every request still goes out for real, so a rendering that
 * the server would reject shows up rather than being asserted against a mock.
 */
describe("Olingo Library: service API", () => {
  test("createKey and parseKey round trip a simple key", () => {
    const key = LIBRARY.Books().createKey(BOOK_DER_PROZESS);

    // typed, as everywhere in V2 - and relative, so it can be appended to a service root
    expect(key).toBe(`Books(guid'${BOOK_DER_PROZESS}')`);
    expect(LIBRARY.Books().parseKey(key)).toBe(BOOK_DER_PROZESS);
  });

  test("createKey and parseKey round trip a composite key", () => {
    // the more interesting case, and the one with no counterpart in examples/main: two key properties
    // of different types, each carrying its own V2 literal notation
    const key = LIBRARY.Copies().createKey(COPY_KEY);

    expect(key).toBe(`Copies(MediumId=guid'${BOOK_DER_PROZESS}',InventoryNumber=1001)`);
    expect(LIBRARY.Copies().parseKey(key)).toStrictEqual(COPY_KEY);
  });

  test("getKeySpec describes the key", () => {
    expect(
      LIBRARY.Books()
        .getKeySpec()
        .map((param) => param.getName()),
    ).toStrictEqual(["Id"]);
    expect(
      LIBRARY.Copies()
        .getKeySpec()
        .map((param) => param.getName()),
    ).toStrictEqual(["MediumId", "InventoryNumber"]);
  });

  test("a parsed key addresses the entity it came from", async () => {
    // the round trip is only worth anything if the result is usable, so it is used
    const parsed = LIBRARY.Copies().parseKey(LIBRARY.Copies().createKey(COPY_KEY));
    const result = await LIBRARY.Copies(parsed).query().execute();

    expect(result.status).toBe(200);
    expect(result.data.d.InventoryNumber).toBe(1001);
  });

  test("addToQuery adds options to a command that already exists", async () => {
    // `query()` takes its options up front, but a command can also be widened afterwards - which is what
    // `addToQuery` is for, and it composes with what the query function already set
    const cmd = LIBRARY.Books()
      .query((builder, q) => builder.filter(q.Language.eq("de")))
      .addToQuery((builder) => builder.select("Title").top(1));

    const url = decodeURIComponent(cmd.getUrl());
    expect(url).toContain("$filter=Language eq 'de'");
    expect(url).toContain("$select=Title");
    expect(url).toContain("$top=1");

    const result = await cmd.execute();
    expect(result.status).toBe(200);
    expect(result.data.d.results).toHaveLength(1);
    expect(result.data.d.results[0].ISBN).toBeUndefined();
  });

  test("a query option on a modification request is out of scope for V2", async () => {
    /*
     * `addToQuery` is available on the write commands too, because the command type is shared - but V2
     * defines system query options for retrieval only. There is no `$select` on a `PUT` to honour, and
     * nothing in [MS-ODATA] says what a service should do with one.
     *
     * This server routes on the shape of the URI, so an entity URI carrying a query option is simply a
     * route with no `PUT` handler and the answer is 405. That is a conforming reaction to a request the
     * protocol does not describe; the interesting part is only that the client lets it be expressed.
     */
    const created = await LIBRARY.Books().create({ Title: "write option probe", Language: "de" }).execute();
    const id = created.data.d.Id;

    await expectODataError(
      LIBRARY.Books(id)
        .update({ Title: "write option probe", Language: "de" })
        .addToQuery((builder) => builder.select("Title"))
        .execute(),
      { status: 405, message: /does not allow the HTTP method/ },
    );

    // the same write without the option is an ordinary V2 request and succeeds
    expect((await LIBRARY.Books(id).update({ Title: "write option probe", Language: "de" }).execute()).status).toBe(
      204,
    );

    await LIBRARY.Books(id).delete().execute();
  });

  test("the select wildcard", async () => {
    const cmd = LIBRARY.Books().query((builder) => builder.select("*"));
    expect(decodeURIComponent(cmd.getUrl())).toContain("$select=*");

    const result = await cmd.execute();
    expect(result.status).toBe(200);
    // everything comes back, unlike a narrowed select
    expect(result.data.d.results[0].ISBN).toBeDefined();
  });

  test("the select wildcard inside expanding flattens to a path", async () => {
    // `$select=Location/*` - the nested spelling, which only exists because V2 has to flatten what V4
    // would nest inside `$expand`
    const cmd = LIBRARY.Copies(COPY_KEY).query((builder) =>
      builder.expanding("Location", (branch) => branch.select("*")),
    );
    const url = decodeURIComponent(cmd.getUrl());
    expect(url).toContain("$select=Location/*");
    expect(url).toContain("$expand=Location");

    const result = await cmd.execute();
    expect(result.status).toBe(200);
    expect((result.data.d.Location as unknown as { Name: string }).Name).toBeDefined();
  });
});
