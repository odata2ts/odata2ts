import { afterAll, describe, expect, test } from "vitest";
import { EditableBooks } from "../../src-generated/library/LibraryModel.js";
import { LIBRARY } from "../LibraryTestConstants.js";

/**
 * Binding an already existing entity to a navigation property - odata2ts issue #38 - against CAP.
 *
 * The client states a binding by the key of the entity to bind (`{"@id": key}`); the query objects turn
 * that key into the URL of the referenced entity and, since this client targets OData 4.0, into the
 * `Nav@odata.bind` property. Whether that URL is one the server resolves is exactly what a fixture
 * cannot show and these tests can.
 *
 * `Book/Publisher` is an **association**, which is the case CAP refuses for a deep insert of anything
 * but the key (see DeepInsert.test.ts) - a binding is the supported way to point it somewhere. It also
 * has to be an entity without an ETag: `Copies` carries `@odata.etag`, so every write against it needs
 * `If-Match`, which odata2ts does not send (see test/v2/core/CrudOperations.test.ts).
 */
describe("CAP Library: binding existing entities", () => {
  const createdBooks: Array<string> = [];

  async function createBook(title: string, editable: Omit<EditableBooks, "Title">) {
    const created = await LIBRARY.Books()
      .create({ Title: title, ...editable })
      .execute();
    createdBooks.push(created.data.Id);
    return created;
  }

  async function anyTwoPublisherIds() {
    const publishers = await LIBRARY.Publishers()
      .query((builder, qPublisher) => builder.select("Id").orderBy(qPublisher.Id.asc()).top(2))
      .execute();
    return publishers.data.value.map((publisher) => publisher.Id);
  }

  afterAll(async () => {
    for (const id of createdBooks) {
      await LIBRARY.Books(id).delete().execute();
    }
  });

  test("create with a binding links the entity", async () => {
    const [publisherId] = await anyTwoPublisherIds();

    const created = await createBook("Bound On Create", { Publisher: { "@id": publisherId } });
    expect(created.status).toBe(201);

    const publisher = await LIBRARY.Books(created.data.Id).Publisher().query().execute();
    expect(publisher.data.Id).toBe(publisherId);
  });

  test("patching the binding re-points the link", async () => {
    const [firstPublisher, secondPublisher] = await anyTwoPublisherIds();

    const created = await createBook("Bound On Patch", { Publisher: { "@id": firstPublisher } });
    const book = LIBRARY.Books(created.data.Id);

    const patched = await book.patch({ Publisher: { "@id": secondPublisher } }).execute();
    expect(patched.status).toBe(200);

    const publisher = await book.Publisher().query().execute();
    expect(publisher.data.Id).toBe(secondPublisher);

    // The decisive assertion. Re-pointing a reference must not write the new key into the previously
    // linked publisher, which would leave two entities with the same key behind - and still answer 200.
    const publishers = await LIBRARY.Publishers()
      .query((builder, qPublisher) => builder.select("Id").orderBy(qPublisher.Id.asc()).top(2))
      .execute();
    expect(publishers.data.value.map((p) => p.Id)).toStrictEqual([firstPublisher, secondPublisher]);
  });

  test("the key may be stated in its long form as well", async () => {
    const [publisherId] = await anyTwoPublisherIds();

    // `PublishersId` is a single-key id model, so it accepts the value on its own or the object - both
    // have to end up as the same URL
    const created = await createBook("Bound By Long Key", { Publisher: { "@id": { Id: publisherId } } });
    expect(created.status).toBe(201);

    const publisher = await LIBRARY.Books(created.data.Id).Publisher().query().execute();
    expect(publisher.data.Id).toBe(publisherId);
  });

  test("binding to null clears the link", async () => {
    const [publisherId] = await anyTwoPublisherIds();

    const created = await createBook("Bound Then Cleared", { Publisher: { "@id": publisherId } });
    const book = LIBRARY.Books(created.data.Id);

    const patched = await book.patch({ Publisher: null }).execute();
    expect(patched.status).toBe(200);

    const read = await book.query((builder) => builder.expanding("Publisher", (publisher) => publisher)).execute();
    expect(read.data.Publisher).toBeNull();
  });
});
