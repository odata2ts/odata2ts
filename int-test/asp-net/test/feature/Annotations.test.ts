import { describe, expect, expectTypeOf, test } from "vitest";
import type { EditableBook, EditableMedium } from "../../src-generated/library/library-catalog/index.js";
import { BOOK_DER_PROZESS, LIBRARY } from "../LibraryTestConstants.js";

/**
 * Evaluation of the `Org.OData.Core.V1` terms against ASP.NET, the counterpart of the same file in
 * `int-test/cap`.
 *
 * What makes it worth running twice is the spelling. ASP.NET writes the term out in full
 * (`Org.OData.Core.V1.Computed`) and declares **no** `edmx:Reference` whatsoever, while CAP declares the
 * vocabulary under the alias `Core` and writes `Core.Computed`. A generator that only resolved aliases
 * would fail here, one that only compared bare names would fail there.
 *
 * The boundary is visible in the same model: only `Medium/PopularityScore` is annotated, so every key of
 * this service still gets its managed state from the "a single key prop is server-generated" heuristic.
 */
describe("ASP.NET Library: Core annotations", () => {
  test("Core.Computed is understood without a vocabulary reference", async () => {
    expectTypeOf<EditableMedium>().not.toHaveProperty("PopularityScore");

    // readable all the same: the term keeps a property out of the payload, not out of the model
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
    expectTypeOf<EditableBook>().not.toHaveProperty("PopularityScore");

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

  test("an unannotated key stays with the heuristic", async () => {
    // Nothing in this model says anything about `Id`, so the single-key rule still decides - which is
    // exactly what `managedPropertyDetection: "auto"` is for.
    expectTypeOf<EditableMedium>().not.toHaveProperty("Id");
    expectTypeOf<EditableBook>().not.toHaveProperty("Id");
  });
});
