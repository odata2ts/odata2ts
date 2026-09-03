import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataEntityModelResponseV2 } from "@odata2ts/odata-core";
import { afterAll, describe, expect, expectTypeOf, test } from "vitest";
import { Book } from "../../src-generated/library/LibraryModel.js";
import { expectODataError } from "../expectODataError.js";
import { LIBRARY, UNKNOWN_ID } from "../LibraryTestConstants.js";

/**
 * Binding an already existing entity to a navigation property - odata2ts issue #38 - against Olingo 2.
 *
 * This is the only genuine OData V2 server we have, and therefore the only place where the V2 notation
 * the query objects build from `{"@id": key}` - `{"__metadata": {"uri": "Publishers(1)"}}` - meets a real
 * V2 deserializer. Everything the client assembles is under test here: that the URL points at the right
 * entity set, that a relative URL is resolved, and that the server ends up moving the link.
 *
 * `Book/Publisher` is the navigation used throughout, because `Copies` carries a concurrency token and
 * odata2ts sends no `If-Match` - see test/core/CrudOperations.test.ts.
 */
describe("Olingo Library: binding existing entities", () => {
  const createdBooks: Array<string> = [];

  async function publisherIds() {
    const publishers = await LIBRARY.Publishers()
      .query((builder, qPublisher) => builder.select("Id").orderBy(qPublisher.Id.asc()).top(2))
      .execute();
    return publishers.data.d.results.map((publisher) => publisher.Id);
  }

  async function publisherOf(bookId: string) {
    const read = await LIBRARY.Books(bookId)
      .query((builder) => builder.expand("Publisher"))
      .execute();
    return read.data.d.Publisher as { Id: number; Name: string };
  }

  async function createBook(title: string, publisherId: number) {
    const created = await LIBRARY.Books()
      .create({ Title: title, Publisher: { "@id": publisherId } })
      .execute();
    createdBooks.push(created.data.d.Id);
    return created;
  }

  afterAll(async () => {
    for (const id of createdBooks) {
      await LIBRARY.Books(id).delete().execute();
    }
  });

  test("create with a binding links the entity", async () => {
    const [publisherId] = await publisherIds();

    const created = await createBook("Bound On Create", publisherId);

    expect(created.status).toBe(201);
    expectTypeOf(created).toEqualTypeOf<HttpResponseModel<ODataEntityModelResponseV2<Book>>>();
    expect((await publisherOf(created.data.d.Id)).Id).toBe(publisherId);
  });

  test("the key may be stated in its long form as well", async () => {
    const [publisherId] = await publisherIds();

    // `PublisherId` is a single-key id model, so it accepts the value on its own or the object - both
    // have to end up as the same URL
    const created = await LIBRARY.Books()
      .create({ Title: "Bound By Long Key", Publisher: { "@id": { Id: publisherId } } })
      .execute();
    createdBooks.push(created.data.d.Id);

    expect(created.status).toBe(201);
    expect((await publisherOf(created.data.d.Id)).Id).toBe(publisherId);
  });

  test("patching the binding re-points the link", async () => {
    const [firstPublisher, secondPublisher] = await publisherIds();

    const created = await createBook("Bound On Patch", firstPublisher);
    const book = LIBRARY.Books(created.data.d.Id);

    const patched = await book.patch({ Publisher: { "@id": secondPublisher } }).execute();
    expect(patched.status).toBe(204);
    expect((await publisherOf(created.data.d.Id)).Id).toBe(secondPublisher);

    // The decisive assertion. Re-pointing a reference must not write the new key into the previously
    // linked publisher, which would leave two entities with the same key behind - and still answer 204.
    const publishers = await LIBRARY.Publishers()
      .query((builder, qPublisher) => builder.select("Id").orderBy(qPublisher.Id.asc()).top(2))
      .execute();
    expect(publishers.data.d.results.map((publisher) => publisher.Id)).toStrictEqual([firstPublisher, secondPublisher]);
  });

  test("a binding to an entity that does not exist is refused", async () => {
    const [publisherId] = await publisherIds();
    const created = await createBook("Bound Then Refused", publisherId);
    const book = LIBRARY.Books(created.data.d.Id);

    // 9999 is no publisher of this model - the server resolves the URL before it writes anything
    await expectODataError(book.patch({ Publisher: { "@id": 9999 } }).execute(), {
      status: 404,
      message: /could not be found/,
    });

    // and the link that was there is untouched
    expect((await publisherOf(created.data.d.Id)).Id).toBe(publisherId);
  });

  test("an update without the navigation property leaves the link alone", async () => {
    const [publisherId] = await publisherIds();
    const created = await createBook("Bound And Renamed", publisherId);
    const book = LIBRARY.Books(created.data.d.Id);

    const patched = await book.patch({ Title: "Renamed" }).execute();
    expect(patched.status).toBe(204);

    const read = await LIBRARY.Books(created.data.d.Id)
      .query((builder) => builder.expand("Publisher"))
      .execute();
    expect(read.data.d.Title).toBe("Renamed");
    expect((read.data.d.Publisher as { Id: number }).Id).toBe(publisherId);
  });

  test("a binding on an entity that does not exist is a 404 of its own", async () => {
    const [publisherId] = await publisherIds();

    await expectODataError(
      LIBRARY.Books(UNKNOWN_ID)
        .patch({ Publisher: { "@id": publisherId } })
        .execute(),
      {
        status: 404,
        message: /could not be found/,
      },
    );
  });
});
