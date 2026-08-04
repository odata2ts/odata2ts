import { afterAll, describe, expect, test } from "vitest";
import { BASE_URL, LIBRARY_V2 } from "../LibraryV2TestConstants.js";

/**
 * Binding an already existing entity to a navigation property - odata2ts issue #38 - over V2.
 *
 * The client states a binding by the key of the entity to bind, exactly as the V4 one does; only what the
 * query objects make of it differs, since V2 has no `@odata.bind`: the navigation property carries
 * `{"__metadata": {"uri": "Publishers(1)"}}` instead.
 *
 * This is where that notation runs into a wall. The V2 adapter accepts such a payload with 201 and does
 * not link anything - no error, no hint. The counter-test below sends the very same body by hand, so the
 * verdict is pinned on the adapter rather than on what odata2ts assembles; and the foreign key, which
 * works, shows that the request itself was fine. `test/feature/Binding.test.ts` proves the same client
 * feature against the V4 endpoint of this very server, where it does link.
 *
 * `int-test/olingo-v2` holds the other half of the V2 picture: a genuine V2 server refuses the very same
 * payload with a loud 501 instead of dropping it in silence.
 */
describe("CAP Library V2: binding existing entities", () => {
  const createdBooks: Array<string> = [];

  async function anyPublisherId() {
    const publishers = await LIBRARY_V2.Publishers()
      .query((builder, qPublisher) => builder.select("Id").orderBy(qPublisher.Id.asc()).top(1))
      .execute();
    return publishers.data.d.results[0].Id;
  }

  async function publisherIdOf(bookId: string) {
    const read = await LIBRARY_V2.Books(bookId)
      .query((builder) => builder.expand("Publisher"))
      .execute();
    return (read.data.d.Publisher as { Id: number } | null)?.Id ?? null;
  }

  test("a binding is accepted and then dropped", async () => {
    const publisherId = await anyPublisherId();

    const created = await LIBRARY_V2.Books()
      .create({ Title: "V2 Bound On Create", Publisher: { "@id": publisherId } })
      .execute();
    createdBooks.push(created.data.d.Id);

    expect(created.status).toBe(201);
    // the link was never made - the adapter says nothing about it
    expect(await publisherIdOf(created.data.d.Id)).toBeNull();
  });

  test("the same body sent by hand fares no better, while the foreign key works", async () => {
    const publisherId = await anyPublisherId();

    // Byte for byte what the query objects assemble from `{"@id": publisherId}`. Sent without odata2ts,
    // so this is the adapter's verdict on the V2 binding notation, not the client's.
    const byHand = await fetch(`${BASE_URL}/Books`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        Title: "V2 Bound By Hand",
        Publisher: { __metadata: { uri: `Publishers(${publisherId})` } },
      }),
    });
    const byHandBody = (await byHand.json()) as { d: { Id: string; Publisher_Id: number | null } };
    createdBooks.push(byHandBody.d.Id);

    expect(byHand.status).toBe(201);
    expect(byHandBody.d.Publisher_Id).toBeNull();

    // the foreign key is the way through over V2 here, and it proves the request itself was well-formed
    const viaForeignKey = await LIBRARY_V2.Books()
      .create({ Title: "V2 Bound By Foreign Key", Publisher_Id: publisherId })
      .execute();
    createdBooks.push(viaForeignKey.data.d.Id);

    expect(await publisherIdOf(viaForeignKey.data.d.Id)).toBe(publisherId);
  });

  afterAll(async () => {
    for (const id of createdBooks) {
      await LIBRARY_V2.Books(id).delete().execute();
    }
  });
});
