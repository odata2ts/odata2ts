import { describe, expectTypeOf, test } from "vitest";
import type { EditableBook, EditableLoan, EditableMember } from "../../src-generated/library/index.js";

/**
 * The `Org.OData.Core.V1` terms as a V2 service states them - which is never as a vocabulary term.
 *
 * V2 has no vocabularies at all: the mechanism arrives in 3.0 and the standard terms in V4. What a V4
 * service writes as `<Annotation Term="Core.Computed"/>` therefore reaches a V2 client as an attribute in
 * a foreign namespace, and this server emits both dialects that got produced widely enough to matter -
 * Microsoft's `annotation:StoreGeneratedPattern` from WCF Data Services and SAP Gateway's
 * `sap:creatable`/`sap:updatable` pair. They are translated into the V4 terms before digestion, so
 * everything downstream sees one set of annotations regardless of version.
 *
 * The counterpart is `int-test/cap/test/v2`, where a V2 service states the terms the V4 way, because
 * CAP's V2 rendition carries the very same `<Annotations>` blocks its V4 endpoint does. Between the two,
 * both ways a V2 document can say this are covered.
 */
describe("Olingo V2 Library: Core annotations in their V2 spelling", () => {
  test("Computed: PopularityScore is stated by both dialects and drops out", () => {
    // annotation:StoreGeneratedPattern="Computed" plus sap:creatable="false" sap:updatable="false"
    expectTypeOf<EditableBook>().not.toHaveProperty("PopularityScore");
  });

  test("Immutable: LoanedAt survives but turns optional", () => {
    // sap:updatable="false" with creatable at its default - settable on insert, fixed from then on. It is
    // `Nullable="false"` in the model, so without the term it would be required here, as DueDate still is.
    expectTypeOf<EditableLoan["LoanedAt"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<EditableLoan["DueDate"]>().toEqualTypeOf<string>();
  });

  test("an unannotated single key is still managed by the heuristic", () => {
    // nothing about this changed: `Medium.Id` carries no annotation in either dialect
    expectTypeOf<EditableBook>().not.toHaveProperty("Id");
  });

  test("no other property is taken for managed", () => {
    expectTypeOf<EditableBook>().toHaveProperty("Title");
    expectTypeOf<EditableBook>().toHaveProperty("PublicationDate");
  });

  test("the two terms V2 cannot express leave their properties alone", () => {
    // `Core.ComputedDefaultValue` on Member.ActiveSince and `Core.Permissions` (Read) on Member.Balance
    // have no V2 form whatsoever - not in either dialect - so the V4 model annotates them and this one
    // cannot. Both stay ordinary editable properties, which is the boundary of what V2 can carry.
    expectTypeOf<EditableMember>().toHaveProperty("ActiveSince");
    expectTypeOf<EditableMember>().toHaveProperty("Balance");
  });
});
