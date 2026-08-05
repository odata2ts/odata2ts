import { DeferredContent } from "@odata2ts/odata-core";
import { describe, expect, expectTypeOf, test } from "vitest";
import { Books, Copies, Members } from "../../../src-generated/library-v2/LibraryV2Model.js";
import { expectODataError } from "../../expectODataError.js";
import { BOOK_DER_PROZESS, LIBRARY_V2 } from "../LibraryV2TestConstants.js";

/**
 * The extra `results` object V2 puts around a collection, and where this server draws its lines.
 *
 * The adapter is the reason `v2ResponseResultsWrapping` and `v2PayloadResultsWrapping` are two options
 * rather than one (odata2ts#237): it **answers** with the wrapping and **refuses** the very same shape in
 * a request. `int-test/olingo-v2` is the other half of the picture - the native server accepts a payload
 * either way, so no response can settle what a payload has to look like. This package is generated with
 * the response option on and the payload option off, and this suite is why.
 *
 * It also pins how far the wrapping reaches: it is how V2 serialises a *feed*, so an entity collection
 * carries it while a collection of a primitive or complex type stays a plain array. odata2ts states that
 * distinction on its own - the option does not.
 */
describe("CAP Library V2: extra results wrapping", () => {
  test("an expanded navigation property carries the wrapping", async () => {
    const result = await LIBRARY_V2.Books(BOOK_DER_PROZESS)
      .query((b) => b.expand("Copies"))
      .execute();

    expect(result.status).toBe(200);

    const copies = result.data.d.Copies as { results: Array<Copies> };
    expect(Object.keys(copies)).toStrictEqual(["results"]);
    expect(copies.results.length).toBeGreaterThan(0);

    expectTypeOf<Books["Copies"]>().toEqualTypeOf<{ results: Array<Copies> } | DeferredContent>();
  });

  test("a primitive and a complex collection stay plain arrays", async () => {
    const book = (await LIBRARY_V2.Books(BOOK_DER_PROZESS).query().execute()).data.d;
    const member = (await LIBRARY_V2.Members(1).query().execute()).data.d;

    // `Keywords` is `Collection(Edm.String)` and `PreviousAddresses` a collection of a complex type -
    // neither is a feed, and the server sends both bare even though it wraps `Copies`
    expect(Array.isArray(book.Keywords)).toBe(true);
    expect(Array.isArray(member.PreviousAddresses)).toBe(true);

    expectTypeOf<Books["Keywords"]>().toEqualTypeOf<Array<string>>();
    expectTypeOf<Members["PreviousAddresses"]>().toExtend<Array<unknown>>();
  });

  test("the wrapping in a payload is refused, which is what keeps the payload option separate", async () => {
    /*
     * The editable models state the plain array because of `v2PayloadResultsWrapping: false`. Sending the
     * wrapped shape means going around them - and the server answers 400 rather than accepting it, unlike
     * Olingo. A single option covering both directions would therefore generate a client which cannot
     * write to this server.
     */
    await expectODataError(
      LIBRARY_V2.Books(BOOK_DER_PROZESS)
        .patch({ Keywords: { results: ["Roman"] } } as unknown as Parameters<
          ReturnType<typeof LIBRARY_V2.Books>["patch"]
        >[0])
        .execute(),
      { status: 400, message: /Value must be an array/ },
    );
  });
});
