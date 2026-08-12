import { describe, expectTypeOf, test } from "vitest";
import type { EditableBook } from "../../src-generated/library/index.js";

/**
 * Where the `Org.OData.Core.V1` terms are *not*, which is the boundary the annotation evaluation has to
 * respect.
 *
 * Olingo 2 emits a CSDL 1.1 document without a single annotation - the vocabularies are a V4 affair, and
 * this server states none of them. Nothing in the digestion is V4-only though: a V2 document may well
 * carry annotations, and CAP's V2 rendition does, which is what `int-test/cap/test/v2` covers. So the
 * question here is only whether an unannotated service still behaves the way it always did.
 *
 * It does, through `managedPropertyDetection: "auto"`: with no annotation to go by, the single-key heuristic
 * decides, exactly as before this feature existed. Anything else would have been a silent breaking change
 * for every service that never adopted the vocabularies.
 */
describe("Olingo V2 Library: no Core annotations", () => {
  test("an unannotated single key is managed by the heuristic", () => {
    expectTypeOf<EditableBook>().not.toHaveProperty("Id");
  });

  test("no other property is taken for managed", () => {
    // the flip side: without annotations nothing else may drop out of the editable model
    expectTypeOf<EditableBook>().toHaveProperty("Title");
    expectTypeOf<EditableBook>().toHaveProperty("PublicationDate");
  });
});
