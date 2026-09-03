import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataCollectionResponseV4, ODataModelResponseV4 } from "@odata2ts/odata-core";
import { describe, expect, expectTypeOf, test } from "vitest";
import { Book, Copy, EditableBook } from "../../src-generated/library-as-v4/index.js";
import { BOOK_DER_PROZESS, COPY_KEY, LIBRARY_AS_V4 } from "../LibraryTestConstants.js";

/**
 * `v2ResponseAsV4`: a V2 service (Olingo here), reshaped so that every response looks like V4.
 *
 * Everything in `core/CrudOperations.test.ts` and `feature/ResultsWrapping.test.ts` pins the raw V2 shape
 * this server actually sends; this suite pins what `LIBRARY_AS_V4` - the very same server, generated with
 * the option turned on - turns that shape into. Read them side by side to see the reshaping at work.
 */
describe("Olingo Library: v2ResponseAsV4", () => {
  test("an entity comes back bare, with __metadata mapped to @odata.* control information", async () => {
    const result = await LIBRARY_AS_V4.Books(BOOK_DER_PROZESS).query().execute();

    expect(result.status).toBe(200);
    expect(result.data).toMatchObject({
      Id: BOOK_DER_PROZESS,
      Title: "Der Prozess",
      ISBN: "9783150094440",
      PageCount: 224,
    });
    // no more "d" envelope, and __metadata.uri became @odata.id
    expect((result.data as any).d).toBeUndefined();
    expect(result.data["@odata.id"]).toContain(`Books(guid'${BOOK_DER_PROZESS}')`);

    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<Book>>>();
  });

  test("an entity carrying a concurrency token maps it to @odata.etag", async () => {
    const result = await LIBRARY_AS_V4.Copies(COPY_KEY).query().execute();

    expect(result.data["@odata.etag"]).toMatch(/^W\//);
  });

  test("a collection comes back as { value: [...] } instead of { d: { results: [...] } }", async () => {
    const result = await LIBRARY_AS_V4.Books().query().execute();

    expect(result.status).toBe(200);
    expect((result.data as any).d).toBeUndefined();
    expect(Array.isArray(result.data.value)).toBe(true);
    expect(result.data.value.length).toBeGreaterThan(0);
    expect(result.data.value.map((book) => book.Title)).toContain("Der Prozess");

    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<ODataCollectionResponseV4<Book>>>();
  });

  test("$count maps __count to @odata.count", async () => {
    const result = await LIBRARY_AS_V4.Books()
      .query((b) => b.count())
      .execute();

    expect(typeof result.data["@odata.count"]).toBe("number");
    expect(result.data["@odata.count"]).toBeGreaterThan(0);
  });

  test("an expanded collection valued navigation property is a plain array, not results-wrapped", async () => {
    const result = await LIBRARY_AS_V4.Books(BOOK_DER_PROZESS)
      .query((b) => b.expand("Copies"))
      .execute();

    expect(Array.isArray(result.data.Copies)).toBe(true);
    const copies = result.data.Copies as Array<Copy>;
    expect(copies.length).toBeGreaterThan(0);
    expect(copies.every((copy) => copy.MediumId === BOOK_DER_PROZESS)).toBe(true);
    // nested __metadata is reshaped exactly like the top-level entity's
    expect((copies[0] as any)["@odata.id"]).toBeTypeOf("string");

    expectTypeOf<Book["Copies"]>().toEqualTypeOf<Array<Copy>>();
  });

  test("an unexpanded navigation property is simply absent, not a __deferred stub", async () => {
    const result = await LIBRARY_AS_V4.Books(BOOK_DER_PROZESS).query().execute();

    expect(result.data).not.toHaveProperty("Copies");
  });

  test("create, read and delete an entity in V4 shape", async () => {
    const newBook: EditableBook = { Title: "Reshaped As V4", Language: "de", PageCount: 111 };

    const created = await LIBRARY_AS_V4.Books().create(newBook).execute();
    expect(created.status).toBe(201);
    expect(created.data).toMatchObject(newBook);
    expect((created.data as any).d).toBeUndefined();
    expectTypeOf(created).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<Book>>>();

    const id = created.data.Id;
    const read = await LIBRARY_AS_V4.Books(id).query().execute();
    expect(read.data).toMatchObject(newBook);

    const deleted = await LIBRARY_AS_V4.Books(id).delete().execute();
    expect(deleted.status).toBe(204);
  });
});
