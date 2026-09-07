import { describe, expect, test } from "vitest";
import { LIBRARY, UNKNOWN_ID } from "../LibraryTestConstants.js";

/**
 * `$batch` against the ASP.NET Core OData server - the one that, unlike the V2 server, speaks the **JSON**
 * wire format as well as multipart. Both are exercised, because the point of the format option is that the
 * application picks the wire format and the builder stays format-agnostic: the same builder, the same
 * slots, two different ways of going out.
 */
describe("ASP.NET Library: $batch", () => {
  test("json answers every sub-request", async () => {
    const members = LIBRARY.Members().query((b) => b.top(2));
    const count = LIBRARY.Media().query((b) => b.count());

    const [membersResult, countResult] = await LIBRARY.batch().add(members).add(count).execute({ format: "json" });

    expect(membersResult.status).toBe(200);
    expect(membersResult.data?.value.length).toBe(2);

    expect(countResult.status).toBe(200);
    expect(countResult.data?.["@odata.count"]).toBeGreaterThan(0);
  });

  test("multipart answers every sub-request", async () => {
    const members = LIBRARY.Members().query((b) => b.top(2));

    const [membersResult] = await LIBRARY.batch().add(members).execute();

    expect(membersResult.status).toBe(200);
    expect(membersResult.data?.value.length).toBe(2);
  });

  test("continueOnError still answers the sub-request that follows a failing one", async () => {
    const missing = LIBRARY.Media(UNKNOWN_ID).query();
    const media = LIBRARY.Media().query((b) => b.top(1));

    const [missingResult, mediaResult] = await LIBRARY.batch()
      .add(missing)
      .add(media)
      .execute({ continueOnError: true });

    expect(missingResult.status).toBe(404);
    expect(mediaResult.status).toBe(200);
    expect(mediaResult.data?.value.length).toBe(1);
  });
});
