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
 * just-created parent by the parent request's id (`byRef`) is the URL form of a reference; a child bound
 * through a navigation property that carries the `$<id>` token is the body form (which V2 renders as
 * `__metadata.uri`). Both go out multipart.
 */
describe("Olingo V2 Library: $batch referencing", () => {
  test("creates a child under the just-created parent by URL reference", async () => {
    const audiobook = LIBRARY.Audiobooks().create({ Title: "Referenced audiobook" });
    const chapter = LIBRARY.Audiobooks().byRef(1).Chapters().create({ Title: "Referenced chapter" });

    const [audiobookResult, chapterResult] = await LIBRARY.batch().add(audiobook).add(chapter).execute();

    expect(audiobookResult.status).toBe(201);
    expect(chapterResult.status).toBe(201);
  });

  test("binds a child's navigation property to the just-created parent by body reference", async () => {
    const book = LIBRARY.Books().create({ Title: "Referenced book" });
    const copy = LIBRARY.Copies().create({
      IsLoanable: true,
      InventoryNumber: 1001,
      Medium: { "@id": ref(1) },
    });

    const [bookResult, copyResult] = await LIBRARY.batch().add(book).add(copy).execute();

    expect(bookResult.status).toBe(201);
    expect(copyResult.status).toBe(201);
  });

  test("surfaces the server's error for a request that references an id that does not exist", async () => {
    const orphan = LIBRARY.Audiobooks().byRef(999).Chapters().create({ Title: "Orphan chapter" });

    const [orphanResult] = await LIBRARY.batch().add(orphan).execute();

    expect(orphanResult.status).toBeGreaterThanOrEqual(400);
    expect(orphanResult.status).toBeLessThan(500);
  });
});
