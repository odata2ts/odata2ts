import { describe, expect, test } from "vitest";
import { expectODataError } from "../expectODataError.js";
import { LIBRARY, UNKNOWN_ID } from "../LibraryTestConstants.js";

/**
 * `$batch` against the SAP CAP server, which serves the V4 endpoint (the V2 rendition's `$batch` is covered
 * in `int-test/olingo-v2`). This runs the V4 client over the default **multipart** wire format - the one that
 * works for every OData version - and, against a real server, the direction the unit tests cannot settle:
 * that the server really answers each sub-request and that a failing one leaves its slot carrying the error
 * while the others still answer.
 */
describe("CAP Library: $batch", () => {
  test("multipart answers every sub-request with its own answer", async () => {
    const books = LIBRARY.Books().query((b) => b.top(2));
    const count = LIBRARY.Books().query((b) => b.count());

    const [booksResult, countResult] = await LIBRARY.batch().add(books).add(count).execute();

    expect(booksResult.status).toBe(200);
    expect(booksResult.data?.value.length).toBe(2);

    expect(countResult.status).toBe(200);
    expect(countResult.data?.["@odata.count"]).toBeGreaterThan(0);
  });

  test("a failing sub-request leaves its slot carrying the error, the others still answer", async () => {
    const books = LIBRARY.Books().query((b) => b.top(1));
    const missing = LIBRARY.Books(UNKNOWN_ID).query();

    const [booksResult, missingResult] = await LIBRARY.batch().add(books).add(missing).execute();

    expect(booksResult.status).toBe(200);
    expect(missingResult.status).toBe(404);
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
    expect(booksResult.data?.value.length).toBe(1);
  });
});

/**
 * Request referencing, over multipart. CAP has no JSON `$batch`, so the reference goes out multipart and the
 * child request is addressed **under** the just-created parent by the parent request's id (`byRef`) - the URL
 * form of a reference. The body form (a navigation property bound through the `$<id>` token) is not expressible
 * here: it needs a navigation whose key is a string, but CAP's `Copy` binds its medium through the `MediumId`
 * key property rather than a navigation, and none of CAP's navigations is string-keyed.
 */
describe("CAP Library: $batch referencing", () => {
  test("creates a child under the just-created parent by URL reference", async () => {
    const audiobook = LIBRARY.Audiobooks().create({ Title: "Referenced audiobook" });
    const chapter = LIBRARY.Audiobooks().byRef(1).Chapters().create({ Title: "Referenced chapter" });

    const [audiobookResult, chapterResult] = await LIBRARY.batch().add(audiobook).add(chapter).execute();

    expect(audiobookResult.status).toBe(201);
    expect(chapterResult.status).toBe(201);
  });

  test("rejects the whole batch for a request that references an id that does not exist", async () => {
    const orphan = LIBRARY.Audiobooks().byRef(999).Chapters().create({ Title: "Orphan chapter" });

    // the reference is unresolvable, so the batch is refused as a whole with 400 and the parser's message,
    // not with a per-slot error
    await expectODataError(LIBRARY.batch().add(orphan).execute(), {
      status: 400,
      message: /Deserialization Error: "999" does not match the id or atomicity group of any preceding request/,
    });
  });
});
