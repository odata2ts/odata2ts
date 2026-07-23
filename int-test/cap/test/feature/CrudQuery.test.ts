import { afterEach, describe, expect, test } from "vitest";
import { EditableBooks } from "../../src-generated/library/LibraryModel";
import { BOOK_DER_PROZESS, LIBRARY } from "../LibraryTestConstants";

/**
 * System query options on **write** requests: `create`, `add`, `update` and `patch`.
 *
 * odata2ts sends the options; whether a server honours them is a different question. Where the server
 * rejects the request, that rejection is asserted instead - the point is to pin down the actual,
 * observed behaviour of this server.
 *
 * Note that `update`, `patch` and `add` return no body by default (204); `<true>` asks for the changed
 * entity via `Prefer: return=representation`, which is what makes a query option meaningful at all.
 */
describe("CAP Library: query options on write requests", () => {
  const createdBooks: Array<string> = [];

  afterEach(async () => {
    while (createdBooks.length) {
      await LIBRARY.Books(createdBooks.pop()!).delete().execute();
    }
  });

  async function givenBook(): Promise<string> {
    const book: EditableBooks = { Title: "Ein Landarzt", Language: "de", PageCount: 48 };
    const created = await LIBRARY.Books().create(book).execute();
    createdBooks.push(created.data.Id);
    return created.data.Id;
  }

  test("$select on create", async () => {
    const newBook: EditableBooks = { Title: "Amerika", Language: "de", PageCount: 318 };

    const created = await LIBRARY.Books()
      .create(newBook, undefined, (b) => b.select("Id", "Title"))
      .execute();
    createdBooks.push(created.data.Id);

    expect(created.status).toBe(201);
    expect(created.data.Title).toBe(newBook.Title);
    expect(created.data.Id).toBeDefined();
    // CAP does not narrow the response of a write request: the full entity comes back, including
    // properties that were not selected.
    expect(created.data.PageCount).toBe(newBook.PageCount);
  });

  test("$select on update", async () => {
    const id = await givenBook();
    const changed: EditableBooks = { Title: "Ein Landarzt (2. Auflage)", Language: "de", PageCount: 52 };

    const updated = await LIBRARY.Books(id)
      .update<true>(changed, undefined, (b) => b.select("Id", "Title"))
      .execute();

    expect(updated.status).toBe(200);
    expect(updated.data.Title).toBe(changed.Title);
    expect(updated.data.PageCount).toBe(changed.PageCount);
  });

  test("$select on patch", async () => {
    const id = await givenBook();

    const patched = await LIBRARY.Books(id)
      .patch<true>({ PageCount: 49 }, undefined, (b) => b.select("Id", "Title"))
      .execute();

    expect(patched.status).toBe(200);
    expect(patched.data.PageCount).toBe(49);
    // untouched properties are still part of the response
    expect(patched.data.Title).toBe("Ein Landarzt");
  });

  test("add to a collection-valued property is rejected by the server", async () => {
    // `Keywords` is the only collection service in this model and it holds plain strings, so no system
    // query option would be meaningful for it anyway. More importantly, CAP stores such a property as a
    // plain array element rather than exposing it as an addressable collection resource, so odata2ts'
    // `add()` - a POST against that path - is refused outright. Asserted so the limitation stays visible.
    const id = await givenBook();

    await expect(LIBRARY.Books(id).Keywords().add<true>("Testschlagwort").execute()).rejects.toThrow(
      /Method POST is not allowed/,
    );
  });
});
