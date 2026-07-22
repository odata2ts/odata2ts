import { AxiosClient } from "@odata2ts/http-client-axios";
import { describe, expect, inject, test } from "vitest";
import { LibraryService } from "../src-generated/library/LibraryService";

/**
 * Integration tests against the CAP implementation of the standardized "Library" OData V4 test model.
 *
 * The base URL comes from `globalSetup` (Docker container, or an external server via `LIBRARY_BASE_URL`).
 * Assertions use the fixed seed data from the server repo (`server/db/data/*.csv` in `test-server-cap`).
 */
const baseUrl = inject("libraryBaseUrl");
const service = new LibraryService(new AxiosClient(), baseUrl);

// "Der Prozess" - a book with a fixed key from Library.Catalog-Book.csv
const DER_PROZESS = "11111111-1111-1111-1111-111111111111";
const UNKNOWN_ID = "00000000-0000-0000-0000-000000000000";

describe("CAP Library server: queries", () => {
  test("collection query with $count", async () => {
    const result = await service.Books().query((b) => b.count()).execute();

    expect(result.status).toBe(200);
    expect(result.data.value.length).toBeGreaterThan(0);
    expect(result.data["@odata.count"]).toBeGreaterThan(0);
  });

  test("get a single entity by key", async () => {
    const result = await service.Books(DER_PROZESS).query().execute();

    expect(result.status).toBe(200);
    expect(result.data).toMatchObject({
      Id: DER_PROZESS,
      Title: "Der Prozess",
      Language: "de",
      ISBN: "9783150094440",
      PageCount: 224,
    });
  });

  test("select and filter a collection", async () => {
    const result = await service
      .Books()
      .query((b, q) => b.select("Title", "Language").filter(q.Language.eq("de")).top(50))
      .execute();

    expect(result.status).toBe(200);
    expect(result.data.value.length).toBeGreaterThan(0);
    expect(result.data.value.every((book) => book.Language === "de")).toBe(true);
  });

  test("unknown key yields 404", async () => {
    await expect(service.Books(UNKNOWN_ID).query().execute()).rejects.toMatchObject({ status: 404 });
  });
});

describe("CAP Library server: operations", () => {
  test("unbound function returning a primitive", async () => {
    const result = await service.TotalMediaCount().execute();

    expect(result.status).toBe(200);
    // Edm.Int64 is emitted as string without a converter
    expect(String(result.data.value)).toMatch(/^\d+$/);
    expect(Number(result.data.value)).toBeGreaterThan(0);
  });
});
