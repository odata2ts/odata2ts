import { describe, expect, test } from "vitest";
import { expectODataError } from "../expectODataError.js";
import { BASE_URL, BOOK_DER_PROZESS, LIBRARY } from "../LibraryTestConstants.js";

/**
 * Query options in the request body - odata2ts issue #383 - end to end against a real server.
 *
 * `asPostRequest()` turns a read request into `POST <resource>/$query` carrying the query string as a
 * `text/plain` body. The point of the feature is the request that a URL cannot carry at all, so the last
 * test builds exactly that: the same query is rejected as a GET and answered as a POST.
 *
 * This is the first server we can prove it against, and therefore the only place the feature is covered
 * end to end: the live Trippin service does not implement `$query` and answers 500 to any POST against
 * it, whatever the body - it cannot tell a correct request from a broken one. The test that used to sit
 * in `examples/main/int-test`, permanently skipped for that reason, is gone.
 */
describe("ASP.NET Library: query options in the request body", () => {
  test("the read request is rewritten into POST <resource>/$query", () => {
    const candidate = LIBRARY.Media(BOOK_DER_PROZESS).query((builder) => builder.select("Title"));

    expect(candidate.getInfo()).toMatchObject({
      method: "GET",
      url: `${BASE_URL}/Media(${BOOK_DER_PROZESS})?%24select=Title`,
    });
    expect(candidate.asPostRequest().getInfoConverted()).toMatchObject({
      method: "POST",
      url: `${BASE_URL}/Media(${BOOK_DER_PROZESS})/$query`,
      headers: { "Content-Type": "text/plain" },
      data: "%24select=Title",
    });
  });

  test("$select in the body is applied", async () => {
    const result = await LIBRARY.Media(BOOK_DER_PROZESS)
      .query((builder) => builder.select("Title"))
      .asPostRequest()
      .execute();

    expect(result.status).toBe(200);
    expect(result.data.Title).toBe("Der Prozess");
    expect(result.data.Language).toBeUndefined();
  });

  test("$filter in the body is applied, not silently ignored", async () => {
    // A server that routes the request but drops the body answers 200 with the *unfiltered* set, which is
    // indistinguishable from a genuine result unless the assertion pins the narrowing down - so it does.
    const all = await LIBRARY.Media()
      .query((builder) => builder.count().top(0))
      .execute();

    const filtered = await LIBRARY.Media()
      .query((builder, qMedium) => builder.filter(qMedium.Language.eq("de")))
      .asPostRequest()
      .execute();

    expect(filtered.status).toBe(200);
    expect(filtered.data.value.length).toBeGreaterThan(0);
    expect(filtered.data.value.length).toBeLessThan(Number(all.data["@odata.count"]));
    expect(filtered.data.value.every((medium) => medium.Language === "de")).toBe(true);
  });

  test("the body carries a query the URL is too long for", async () => {
    // The reason the feature exists. Ten titles of ~860 characters each push the encoded URL past
    // Kestrel's 8 KB request-line limit, while the expression stays below OData's node-count limit of 100
    // - so the *only* thing that differs between the two requests is where the query travels.
    const longTitles = Array.from({ length: 10 }, (_, i) => `${"a long book title ".repeat(48)}${i}`);
    const candidate = LIBRARY.Media().query((builder, qMedium) =>
      builder.filter(longTitles.map((title) => qMedium.Title.eq(title)).reduce((all, term) => all.or(term))),
    );

    expect(candidate.getUrl().length).toBeGreaterThan(8192);
    // 414 is the whole point: the request line is too long, and Kestrel refuses it without a body
    await expectODataError(candidate.execute(), { status: 414, message: /No error message/ });

    const result = await candidate.asPostRequest().execute();

    expect(result.status).toBe(200);
    // No such title exists: an empty result proves the filter was parsed, an error would prove nothing.
    expect(result.data.value).toStrictEqual([]);
  });

  test("without query options the request stays a plain GET", async () => {
    // Nothing to move into a body, and `/$query` with an empty one is pointless - so `asPostRequest()`
    // deliberately does nothing here. Asserted end to end, because a server would answer 200 either way.
    const candidate = LIBRARY.Media(BOOK_DER_PROZESS).query();

    expect(candidate.asPostRequest().getInfoConverted()).toMatchObject({
      method: "GET",
      url: `${BASE_URL}/Media(${BOOK_DER_PROZESS})`,
    });

    const result = await candidate.asPostRequest().execute();

    expect(result.status).toBe(200);
    expect(result.data.Title).toBe("Der Prozess");
  });
});
