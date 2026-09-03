import { HttpResponseModel } from "@odata2ts/http-client-api";
import { DeferredContent, ODataEntityModelResponseV2 } from "@odata2ts/odata-core";
import { describe, expect, expectTypeOf, test } from "vitest";
import { Book, Copy, EditableBook } from "../../src-generated/library/LibraryModel.js";
import { BOOK_DER_PROZESS, LIBRARY, UNKNOWN_ID } from "../LibraryTestConstants.js";

/**
 * The extra `results` object V2 puts around a collection valued attribute, and the two options which
 * state it: `v2ResponseResultsWrapping` for what arrives, `v2PayloadResultsWrapping` for what is sent.
 * Both are on for this package (see `odata2ts.config.ts`), because that is what this server does.
 *
 * The client used to strip that layer off a response by itself, which made the generated models describe
 * something the service never sent and left a deep insert payload with no way to state it at all. Now the
 * structure is handed through untouched in both directions, and the two options are what puts it into the
 * types - which is why this suite pins the shape at runtime *and* by type.
 */
describe("Olingo Library: extra results wrapping", () => {
  test("an expanded collection valued navigation property arrives wrapped", async () => {
    const result = await LIBRARY.Books(BOOK_DER_PROZESS)
      .query((b) => b.expand("Copies"))
      .execute();

    expect(result.status).toBe(200);
    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<ODataEntityModelResponseV2<Book>>>();

    // the wrapping is the response, not something the client invents or removes
    const copies = result.data.d.Copies as { results: Array<Copy> };
    expect(Object.keys(copies)).toStrictEqual(["results"]);
    expect(copies.results.length).toBeGreaterThan(0);
    expect(copies.results.every((copy) => copy.MediumId === BOOK_DER_PROZESS)).toBe(true);

    // the generated model states the wrapping, next to the `__deferred` link of an unexpanded read
    expectTypeOf<Book["Copies"]>().toEqualTypeOf<{ results: Array<Copy> } | DeferredContent>();
  });

  test("the values inside the wrapping are converted like any others", async () => {
    // the wrapping must not cut the nested entities off from the conversion: `AcquisitionDate` is a V2
    // `/Date(…)/` string on the wire and `Condition` an Int16 the raw model keeps as number
    const result = await LIBRARY.Books(BOOK_DER_PROZESS)
      .query((b) => b.expand("Copies"))
      .execute();

    const copies = (result.data.d.Copies as { results: Array<Copy> }).results;
    expect(copies[0].AcquisitionDate).toMatch(/^\/Date\(-?\d+\)\/$/);
    expect(typeof copies[0].InventoryNumber).toBe("number");
  });

  test("a deep insert states its nested collection wrapped as well", async () => {
    const created = await LIBRARY.Books()
      .create({
        Title: "Wrapped Deep Insert",
        Language: "de",
        Copies: { results: [{ MediumId: UNKNOWN_ID, InventoryNumber: 9801, IsLoanable: true }] },
      } as EditableBook)
      .execute();

    expect(created.status).toBe(201);

    const copies = await LIBRARY.Books(created.data.d.Id).Copies().query().execute();
    expect(copies.data.d.results.map((copy) => copy.InventoryNumber)).toStrictEqual([9801]);

    await LIBRARY.Books(created.data.d.Id).delete().execute();
  });

  test("the server accepts the unwrapped payload too, which is why the payload option is its own", async () => {
    /*
     * Olingo takes a deep insert either way, so the response side cannot decide the payload side - the
     * very reason the two are separate options (odata2ts#237). Stating the unwrapped shape means going
     * around the generated type here, which is exactly what a user of a service like this would have to
     * do if the options were coupled.
     */
    const created = await LIBRARY.Books()
      .create({
        Title: "Unwrapped Deep Insert",
        Language: "de",
        Copies: [{ MediumId: UNKNOWN_ID, InventoryNumber: 9802, IsLoanable: true }],
      } as unknown as EditableBook)
      .execute();

    expect(created.status).toBe(201);

    const copies = await LIBRARY.Books(created.data.d.Id).Copies().query().execute();
    expect(copies.data.d.results.map((copy) => copy.InventoryNumber)).toStrictEqual([9802]);

    await LIBRARY.Books(created.data.d.Id).delete().execute();
  });
});
