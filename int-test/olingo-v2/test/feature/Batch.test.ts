import { describe, expect, test } from "vitest";
import { LIBRARY } from "../LibraryTestConstants.js";

/**
 * `$batch` against the Apache Olingo 2.0 server - the OData **V2** one. V2 has no JSON `$batch`, so the
 * batch goes out **multipart** (the default). This is the shape SAP systems actually put on the wire, which
 * is why a real V2 server is worth testing rather than only the JSON side. The generator marks this
 * service as V2, so a `json` batch is refused before it ever goes out.
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

  test("refuses a json batch, which V2 has no form of", async () => {
    const books = LIBRARY.Books().query((b) => b.top(1));

    await expect(LIBRARY.batch().add(books).execute({ format: "json" })).rejects.toThrow(/V2/);
  });
});
