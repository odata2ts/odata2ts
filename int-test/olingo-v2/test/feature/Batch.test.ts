import { ref } from "@odata2ts/odata-service";
import { describe, expect, test } from "vitest";
import { LIBRARY, UNKNOWN_ID } from "../LibraryTestConstants.js";

/**
 * `$batch` against the Apache Olingo 2.0 server - the OData **V2** one. V2 has no JSON `$batch`, so the batch
 * goes out **multipart** (the default). This is the shape SAP systems actually put on the wire, which is why a
 * real V2 server is worth testing rather than only the JSON side. The generator stamps this service with the
 * multipart builder, so a JSON batch (the JSON wire format and numeric `dependsOn`) is not even expressible on
 * it - a boundary the type system enforces at compile time, not a runtime refusal.
 */
describe("Olingo V2 Library: $batch", () => {
  test("multipart answers every sub-request", async () => {
    const books = LIBRARY.Books().query((b) => b.top(2));
    const count = LIBRARY.Books().query((b) => b.count());

    const [booksResult, countResult] = await LIBRARY.batch().add(books).add(count).execute();

    expect(booksResult.status).toBe(200);
    expect(booksResult.data?.d.results.length).toBe(2);

    expect(countResult.status).toBe(200);
  });

  test("continueOnError still answers the sub-request that follows a failing one", async () => {
    const missing = LIBRARY.Books(UNKNOWN_ID).query();
    const books = LIBRARY.Books().query((b) => b.top(1));

    const [missingResult, booksResult] = await LIBRARY.batch()
      .add(missing)
      .add(books)
      .execute({ continueOnError: true });

    expect(missingResult.status).toBe(404);
    expect(booksResult.status).toBe(200);
    expect(booksResult.data?.d.results.length).toBe(1);
  });
});

/**
 * Request referencing - the baseline a V2 server must provide. A child request addressed **under** the
 * just-created parent by the parent request's id (`byRef`) is the URL form the V2 spec defines (§2.2.1:
 * `$<id>` as an alias for the Resource Path). The body form places the token in a property value instead
 * - the shape SAP documents (their API_INBOUND_DELIVERY_SRV `$batch` example) - and this server resolves
 * it too, substituting it with the key the preceding request's answer carries. V2 resolves a `$<id>` only
 * within the change set that carries it, so the creating parent and the referring child go out in one
 * atomicity group.
 */
describe("Olingo V2 Library: $batch referencing", () => {
  test("creates a child under the just-created parent by URL reference", async () => {
    const audiobook = LIBRARY.Audiobooks().create({ Title: "Referenced audiobook" });
    const chapter = LIBRARY.Audiobooks().byRef(1).Chapters().create({ Title: "Referenced chapter" });

    const [audiobookResult, chapterResult] = await LIBRARY.batch()
      .startGroup("g")
      .add(audiobook)
      .add(chapter)
      .endGroup()
      .execute();

    expect(audiobookResult.status).toBe(201);
    expect(chapterResult.status).toBe(201);
  });

  // Body substitution in the shape SAP documents: the child's key property carries the reference token
  // ("MediumId": "$1"), and the server substitutes it with the key the preceding request's Location
  // carries before dispatching the request.
  test("binds a child's key property to the just-created parent by body substitution", async () => {
    const book = LIBRARY.Books().create({ Title: "Referenced book" });
    const copy = LIBRARY.Copies().create({
      MediumId: ref(1),
      InventoryNumber: 1001,
      IsLoanable: true,
    });

    const [bookResult, copyResult] = await LIBRARY.batch().startGroup("g").add(book).add(copy).endGroup().execute();

    expect(bookResult.status).toBe(201);
    expect(copyResult.status).toBe(201);
  });

  test("answers 424 for a request that references an id that does not exist", async () => {
    const orphan = LIBRARY.Audiobooks().byRef(999).Chapters().create({ Title: "Orphan chapter" });

    const [orphanResult] = await LIBRARY.batch().startGroup("g").add(orphan).endGroup().execute();

    // Olingo answers the failed change set as a whole (404, "Could not find an entity set or function
    // import for '$999'") without naming the failing part, so the client cannot attribute the failure to
    // the request and can only report the group as failed: 424.
    expect(orphanResult.status).toBe(424);
  });
});
