import { describe, expect, expectTypeOf, test } from "vitest";
import type {
  EditableBook as StrictEditableBook,
  EditableMedium as StrictEditableMedium,
} from "../../src-generated/library-strict/library-catalog/index.js";
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

  test("an unannotated key falls back to the key rule and stays writable", async () => {
    /*
     * Nothing in this model says anything about `Id`, so `managedPropertyDetection: "auto"` falls through
     * to the key rule - which now makes it createOnly rather than readOnly. The property is therefore part
     * of the editable model, optional under the default `lenient` mode.
     */
    expectTypeOf<EditableMedium["Id"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<EditableBook["Id"]>().toEqualTypeOf<string | undefined>();

    // and the decisive half a type check cannot give: the server takes the key the client chose, so
    // keeping it in the payload is right. Under the old readOnly default this was not expressible at all.
    const Id = "44444444-4444-4444-4444-444444444401";
    const created = await LIBRARY.Media()
      .asBookCollectionService()
      .create({ Id, Title: "Client Assigned Key", PageCount: 1, AgeRating: 0 })
      .execute();

    try {
      expect(created.status).toBe(201);
      expect(created.data.Id).toBe(Id);
    } finally {
      await LIBRARY.Media(Id).delete().execute();
    }
  });
});
