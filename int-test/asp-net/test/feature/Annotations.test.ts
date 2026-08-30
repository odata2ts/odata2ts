import { HttpResponseModel } from "@odata2ts/http-client-api";
import { ODataModelResponseV4 } from "@odata2ts/odata-core";
import { describe, expect, expectTypeOf, test } from "vitest";
import type {
  EditableBook as StrictEditableBook,
  EditableMedium as StrictEditableMedium,
} from "../../src-generated/library-strict/library-catalog/index.js";
import type { EditableBook, EditableMedium, PrintMedium } from "../../src-generated/library/library-catalog/index.js";
import type { EditableBranch } from "../../src-generated/library/library-circulation/index.js";
import { BASE_URL, BOOK_DER_PROZESS, BOOK_DER_PROZESS_ISBN, LIBRARY } from "../LibraryTestConstants.js";

/**
 * Evaluation of the `Org.OData.Core.V1` terms against ASP.NET, the counterpart of the same file in
 * `int-test/cap`.
 *
 * What makes it worth running twice is the spelling. ASP.NET writes the term out in full
 * (`Org.OData.Core.V1.Computed`) and declares **no** `edmx:Reference` whatsoever, while CAP declares the
 * vocabulary under the alias `Core` and writes `Core.Computed`. A generator that only resolved aliases
 * would fail here, one that only compared bare names would fail there.
 *
 * The boundary is visible in the same model: the keys carry no annotation of their own, so what becomes
 * of them is `keyProperties`' business rather than the annotations'.
 */
describe("ASP.NET Library: Core annotations", () => {
  test("Core.Computed is understood without a vocabulary reference", async () => {
    // `Core.Computed` makes it readOnly, and under the default `lenient` mode a readOnly property stays
    // in the write model, optional: the spec lets a payload carry one, obliging the server to ignore it
    expectTypeOf<EditableMedium["PopularityScore"]>().toEqualTypeOf<number | null | undefined>();
    // ... while `strictOmit` takes it out, since sending it achieves nothing
    expectTypeOf<StrictEditableMedium>().not.toHaveProperty("PopularityScore");

    // readable either way: the term says who writes the property, not who reads it
    const read = await LIBRARY.Media(BOOK_DER_PROZESS).query().execute();
    expect(read.status).toBe(200);
    expectTypeOf(read.data.PopularityScore).toEqualTypeOf<number | null>();
  });

  test("an annotated property is managed in the derived types too", async () => {
    /*
     * `PopularityScore` is declared - and annotated - on the abstract `Medium`, while the entity sets are
     * of its subtypes. The state therefore has to travel down the whole hierarchy
     * (`Medium` -> `PrintMedium` -> `Book`), which is where an implementation keyed on the entity that
     * happens to be generated would come apart.
     */
    expectTypeOf<EditableBook["PopularityScore"]>().toEqualTypeOf<number | null | undefined>();
    expectTypeOf<StrictEditableBook>().not.toHaveProperty("PopularityScore");

    const created = await LIBRARY.Media()
      .asBookCollectionService()
      .create({ Title: "Annotated Book", PageCount: 1, AgeRating: 0 })
      .execute();

    try {
      expect(created.status).toBe(201);
      expectTypeOf(created.data.PopularityScore).toEqualTypeOf<number | null>();
    } finally {
      await LIBRARY.Media(created.data.Id).delete().execute();
    }
  });

  test("a key the service declares computed is the server's", () => {
    /*
     * Since 0.2.0 the keys are annotated, so nothing here falls through to `keyProperties` any more.
     * `Core.Computed` makes `Medium.Id` readOnly, and under the default `lenient` mode a readOnly
     * property stays in the write model but is never required - the client may send one, and the server
     * is obliged to disregard it.
     */
    expectTypeOf<EditableMedium["Id"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<EditableBook["Id"]>().toEqualTypeOf<string | undefined>();
    // ... and `strictOmit` takes it out altogether, since sending it achieves nothing
    expectTypeOf<StrictEditableBook>().not.toHaveProperty("Id");
  });

  test("the one key left bare is the one the client owns", () => {
    // `Branch/Id` is a code the organisation allocates, so the service says nothing about it - which,
    // now that every generated key does say something, is itself the statement.
    //
    // What the *client* makes of that silence is its own choice. This client runs the default
    // `keyProperties: "interoperable"`, which will not demand a key it cannot be sure of, so the
    // property is optional here. The strict client requires it - see feature/ImmutableProperties.test.ts,
    // which is the pairing that gives the two settings their meaning.
    expectTypeOf<EditableBranch["Id"]>().toEqualTypeOf<number | undefined>();
  });

  /**
   * `Core.AlternateKeys` on `PrintMedium` (`ISBN`, `AppliesTo=EntityType`).
   *
   * `ISBN` is a property of the subtype `PrintMedium`, not of the entity set's declared type `Medium` -
   * so, unlike the primary key, addressing by it needs the type-cast segment in the URL. That is exactly
   * what {@link EntitySetServiceV4.byId} is for: cast the collection first
   * (`asPrintMediumCollectionService()`), then key it - `byId` is the general accessor a subtype cast
   * gets automatically, not something built one-off for this annotation.
   */
  test("Core.AlternateKeys lets ISBN address a PrintMedium, through the cast collection's byId", async () => {
    const printMedium = LIBRARY.Media().asPrintMediumCollectionService().byId({ ISBN: BOOK_DER_PROZESS_ISBN });

    expect(printMedium.getPath()).toBe(
      `${BASE_URL}/Media/Library.Catalog.PrintMedium(ISBN='${BOOK_DER_PROZESS_ISBN}')`,
    );

    const result = await printMedium.query().execute();

    expect(result.status).toBe(200);
    expect(result.data.Title).toBe("Der Prozess");
    expectTypeOf(result).toEqualTypeOf<HttpResponseModel<ODataModelResponseV4<PrintMedium>>>();
  });

  test("Core.AlternateKeys: the primary key still addresses the very same entity", async () => {
    const byPrimaryKey = await LIBRARY.Media(BOOK_DER_PROZESS).query().execute();
    const byAlternateKey = await LIBRARY.Media()
      .asPrintMediumCollectionService()
      .byId({ ISBN: BOOK_DER_PROZESS_ISBN })
      .query()
      .execute();

    expect(byAlternateKey.data.Id).toBe(byPrimaryKey.data.Id);
    expect(byAlternateKey.data.Title).toBe(byPrimaryKey.data.Title);
  });
});
