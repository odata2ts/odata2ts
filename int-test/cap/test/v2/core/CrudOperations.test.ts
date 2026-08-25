import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV2, ODataEntityModelResponseV2 } from "@odata2ts/odata-core";
import { describe, expect, expectTypeOf, test } from "vitest";
import { Books, EditableBooks } from "../../../src-generated/library-v2/LibraryV2Model.js";
import { expectODataError } from "../../expectODataError.js";
import { BASE_URL, BOOK_DER_PROZESS, LIBRARY_V2, UNKNOWN_ID } from "../LibraryV2TestConstants.js";

/**
 * The plain CRUD surface over V2. Same entities, same rows, same server as `test/core/CrudOperations.test.ts` -
 * so every difference here is a difference of the protocol version, or of the adapter translating it.
 *
 * The three that shape every test in this folder:
 *
 * - **the envelope**: V2 wraps everything in `d`, a collection additionally in `results`
 * - **the key**: a key is typed in the URL (`Books(guid'...')`), not bare as in V4
 * - **the write response**: V4 answers a write with 200 + representation only when asked; the adapter answers
 *   200 + representation always - which odata2ts does not type, see the tests below
 */
describe("CAP Library V2: CRUD operations", () => {
  test("a key is written with its type", () => {
    expect(LIBRARY_V2.Books(BOOK_DER_PROZESS).getPath()).toBe(`${BASE_URL}/Books(guid'${BOOK_DER_PROZESS}')`);

    // a compound key names its parts, each typed on its own
    expect(LIBRARY_V2.Copies({ MediumId: BOOK_DER_PROZESS, InventoryNumber: 1001 }).getPath()).toBe(
      `${BASE_URL}/Copies(MediumId=guid'${BOOK_DER_PROZESS}',InventoryNumber=1001)`,
    );
  });

  test("read entity by key", async () => {
    const result = await LIBRARY_V2.Books(BOOK_DER_PROZESS).query().execute();

    expect(result.status).toBe(200);
    expect(result.data.d).toMatchObject({
      Id: BOOK_DER_PROZESS,
      Title: "Der Prozess",
      Language: "de",
      ISBN: "9783150094440",
      PageCount: 224,
    });

    // V2 keeps the payload inside `d` and adds `__metadata` to every entity - the single most visible
    // difference to V4, where `result.data` *is* the entity
    expect(result.data.d.__metadata.uri).toBe(`${BASE_URL}/Books(guid'${BOOK_DER_PROZESS}')`);
    expect(result.data.d.__metadata.type).toBe("Library.Service.Books");

    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<ODataEntityModelResponseV2<Books>>>();
    expectTypeOf(result.data.d.Title).toEqualTypeOf<string>();
    expectTypeOf(result.data.d.PageCount).toEqualTypeOf<number | null>();
  });

  test("read entity collection", async () => {
    const result = await LIBRARY_V2.Books().query().execute();

    expect(result.status).toBe(200);
    expect(result.data.d.results.length).toBeGreaterThan(0);
    expect(result.data.d.results.map((book) => book.Title)).toContain("Der Prozess");

    // `d.results` rather than V4's `value`
    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<ODataCollectionResponseV2<Books>>>();
    expectTypeOf(result.data.d.results).toEqualTypeOf<Array<Books>>();
  });

  test("an unexpanded navigation property arrives as a deferred link", async () => {
    // V4 simply omits what was not expanded. V2 puts a `__deferred` stand-in there instead, which is why
    // the generated model types a navigation property as `T | DeferredContent`.
    const result = await LIBRARY_V2.Books(BOOK_DER_PROZESS).query().execute();

    expect(result.data.d.Copies).toStrictEqual({
      __deferred: { uri: `${BASE_URL}/Books(guid'${BOOK_DER_PROZESS}')/Copies` },
    });
  });

  test("read with unknown key yields 404", async () => {
    await expectODataError(LIBRARY_V2.Books(UNKNOWN_ID).query().execute(), { status: 404, message: /Not Found/ });
  });

  test("create, read, update, patch and delete an entity", async () => {
    const newBook: EditableBooks = {
      Title: "Das Schloss",
      Language: "de",
      PageCount: 352,
    };

    // create
    const created = await LIBRARY_V2.Books().create(newBook).execute();
    expect(created.status).toBe(201);
    expect(created.data.d).toMatchObject(newBook);
    expectTypeOf(created).toEqualTypeOf<HttpResponseModel<ODataEntityModelResponseV2<Books>>>();

    const id = created.data.d.Id;
    expect(id).toBeDefined();

    // read it back
    const read = await LIBRARY_V2.Books(id).query().execute();
    expect(read.status).toBe(200);
    expect(read.data.d).toMatchObject(newBook);

    // update replaces the whole entity - PUT, as in V4
    const updated = await LIBRARY_V2.Books(id)
      .update({ Title: "Das Schloss (2. Auflage)", Language: "de", PageCount: 353 })
      .execute();
    expect(updated.status).toBe(200);
    expect((await LIBRARY_V2.Books(id).query().execute()).data.d.PageCount).toBe(353);

    // patch is a MERGE here: V2 has no PATCH verb, so odata2ts tunnels it through POST + X-Http-Method
    const patched = await LIBRARY_V2.Books(id).patch({ PageCount: 354 }).execute();
    expect(patched.status).toBe(200);

    const afterPatch = await LIBRARY_V2.Books(id).query().execute();
    expect(afterPatch.data.d.PageCount).toBe(354);
    // untouched properties survive a merge
    expect(afterPatch.data.d.Title).toBe("Das Schloss (2. Auflage)");

    // delete
    const deleted = await LIBRARY_V2.Books(id).delete().execute();
    expect(deleted.status).toBe(204);
    expectTypeOf(deleted).toEqualTypeOf<HttpResponseModel<undefined>>();

    await expectODataError(LIBRARY_V2.Books(id).query().execute(), { status: 404, message: /Not Found/ });
  });

  test("the adapter answers a write with a body that the V2 typing does not admit", async () => {
    /*
     * V2 prescribes 204 and no content for `update` and `patch`, and odata2ts types both as
     * `HttpResponseModel<undefined>` accordingly - there is no `<true>` switch in V2 as there is in V4.
     * This server answers 200 with the full entity instead, because that is what the V4 endpoint behind
     * the adapter does. So the data is there at runtime while the compiler says it cannot be, and a caller
     * who wants it has to re-read the entity or cast.
     *
     * Pinned rather than worked around: it is the one place where the V2 client's typing and this server
     * disagree on a plain, everyday request.
     */
    const created = await LIBRARY_V2.Books().create({ Title: "Write Response Probe", Language: "de" }).execute();
    const id = created.data.d.Id;

    const patched = await LIBRARY_V2.Books(id).patch({ PageCount: 42 }).execute();

    expect(patched.status).toBe(200);
    expectTypeOf(patched).toEqualTypeOf<HttpResponseModel<undefined>>();
    // ... and yet:
    expect(patched.data).toBeDefined();

    await LIBRARY_V2.Books(id).delete().execute();
  });

  test("deleting an unknown entity yields 404", async () => {
    await expectODataError(LIBRARY_V2.Books(UNKNOWN_ID).delete().execute(), { status: 404, message: /Not Found/ });
  });

  test("an entity with a concurrency token round-trips", async () => {
    /*
     * `Copy.Condition` carries `@odata.etag`, so every write against a copy needs `If-Match`. This used to
     * be where the client stopped: `Copies` was create-only, in both versions.
     *
     * What V2 adds is that the metadata finally *says* so - `ConcurrencyMode="Fixed"` on the property,
     * where the V4 document emits an empty `Core.OptimisticConcurrency` annotation naming nothing. Both
     * are enough, since the value a client needs always arrives in the response rather than in the model.
     */
    const copy = await LIBRARY_V2.Copies()
      .create({ MediumId: UNKNOWN_ID, InventoryNumber: 9821, IsLoanable: true, Condition: "1" })
      .execute();
    expect(copy.status).toBe(201);

    const key = { MediumId: UNKNOWN_ID, InventoryNumber: 9821 };
    expect((await LIBRARY_V2.Copies(key).query().execute()).data.d.__metadata.etag).toMatch(/^W\//);

    const patched = await LIBRARY_V2.Copies(key).patch({ IsLoanable: false }).execute();
    expect(patched.status).toBe(204);

    // the patch made the old token stale, so the delete needs a fresh read of its own
    await LIBRARY_V2.Copies(key).query().execute();
    const deleted = await LIBRARY_V2.Copies(key).delete().execute();
    expect(deleted.status).toBe(204);
  });

  test("a navigation property is addressable as a sub-resource", async () => {
    const toMany = await LIBRARY_V2.Books(BOOK_DER_PROZESS).Copies().query().execute();
    expect(toMany.status).toBe(200);
    expect(toMany.data.d.results.length).toBeGreaterThan(0);
    expect(toMany.data.d.results.every((copy) => copy.MediumId === BOOK_DER_PROZESS)).toBe(true);

    const toOne = await LIBRARY_V2.Books(BOOK_DER_PROZESS).Publisher().query().execute();
    expect(toOne.status).toBe(200);
    expect(toOne.data.d.Name).toBe("Reclam");
  });
});
