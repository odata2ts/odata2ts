import { describe, expect, test } from "vitest";
import { LIBRARY, UNKNOWN_ID } from "../LibraryTestConstants.js";

/**
 * `$batch` against the SAP CAP server, which serves the V4 endpoint (the V2 rendition's `$batch` is
 * covered in `int-test/olingo-v2`). This runs the V4 client over the default **multipart** wire format -
 * the one that works for every OData version - and, against a real server, the direction the unit tests
 * cannot settle: that the server really answers each sub-request and that a failing one leaves its slot
 * carrying the error while the others still answer.
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

  test("honours top-level dependsOn as ordering", async () => {
    const first = LIBRARY.Books().query((b) => b.top(1));
    const second = LIBRARY.Books().query((b) => b.top(1));

    const [firstResult, secondResult] = await LIBRARY.batch()
      .add(first)
      .add(second, { dependsOn: [first] })
      .execute();

    expect(firstResult.status).toBe(200);
    expect(secondResult.status).toBe(200);
    expect(secondResult.data?.value.length).toBe(1);
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
