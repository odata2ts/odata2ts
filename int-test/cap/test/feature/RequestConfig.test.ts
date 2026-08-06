import { HttpResponseModel } from "@odata2ts/http-client-api";
import { FetchRequestConfig } from "@odata2ts/http-client-fetch";
import { ODataCollectionResponseV4 } from "@odata2ts/odata-core";
import { describe, expect, expectTypeOf, test } from "vitest";
import { Books, EditableBooks } from "../../src-generated/library/LibraryModel.js";
import { LIBRARY } from "../LibraryTestConstants.js";

/**
 * The request configuration handed to `execute()`.
 *
 * Generated services are not generic over the HTTP client, so `execute` cannot know which client it will
 * end up talking to. What every client understands - `headers` and `params` - is therefore the default,
 * and anything a specific client adds on top is opted into by naming that client's config type at the
 * call site. Both halves are exercised here: the common fields without a type argument, and a
 * fetch-specific field with one.
 *
 * The typing assertions are checked by `test-compile`, not at runtime.
 */
describe("CAP Library: request configuration", () => {
  test("the common config needs no type argument", async () => {
    const result = await LIBRARY.Books()
      .query()
      .execute({ params: { $top: 1 } });

    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<ODataCollectionResponseV4<Books>>>();
    expect(result.status).toBe(200);
    // the extra param reached the URL: without it the seed data holds more than one book
    expect(result.data.value).toHaveLength(1);
  });

  test("headers from the config reach the server", async () => {
    const book: EditableBooks = { Title: "Der Heizer", Language: "de", PageCount: 60 };
    const created = await LIBRARY.Books().create(book).execute();

    // a patch answers 204 unless the representation is asked for, and here that header travels via the config
    const patched = await LIBRARY.Books(created.data.Id)
      .patch<true>({ PageCount: 61 })
      .execute({ headers: { Prefer: "return=representation" } });

    expect(patched.status).toBe(200);
    expect(patched.data.PageCount).toBe(61);

    await LIBRARY.Books(created.data.Id).delete().execute();
  });

  test("a fetch specific field requires the fetch config type", async () => {
    const cmd = LIBRARY.Books().query();

    // @ts-expect-error: `signal` belongs to FetchRequestConfig, which the default config does not cover
    await expect(cmd.execute({ signal: AbortSignal.abort() })).rejects.toThrow();

    // named explicitly it compiles - and the client hands the signal on either way, so both requests abort
    await expect(cmd.execute<FetchRequestConfig>({ signal: AbortSignal.abort() })).rejects.toThrow();
  });
});
