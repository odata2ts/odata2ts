import { expectTypeOf } from "vitest";
import type { Amenities as NumericAmenities } from "../src-generated/enum-numeric/library-catalog/index.js";
import type { Branch as NumericBranch } from "../src-generated/enum-numeric/library-circulation/index.js";
import { Amenities as unionAmenityMembers } from "../src-generated/enum-string-union/library-catalog/index.js";
import type { Amenities as UnionAmenities } from "../src-generated/enum-string-union/library-catalog/index.js";
import type { Branch as UnionBranch } from "../src-generated/enum-string-union/library-circulation/index.js";
import type { EditablePostalAddress as StrictEditablePostalAddress } from "../src-generated/managed-strict/library-catalog/index.js";
import type {
  CopyCollectionService as StrictCopyCollectionService,
  CopyService as StrictCopyService,
  EditableCopy as StrictEditableCopy,
  EditableIdDocument as StrictEditableIdDocument,
  UpdatableCopy as StrictUpdatableCopy,
  UpdatableMember as StrictUpdatableMember,
} from "../src-generated/managed-strict/library-circulation/index.js";
import type { Medium as ModelsOnlyMedium } from "../src-generated/models-only/library-catalog/index.js";
import type {
  BookDto,
  DraftMediumDto,
  Medium_ReserveArgsDto,
  MediumDto,
  MediumKeyDto,
} from "../src-generated/naming-custom/library-catalog/index.js";
import type { Member as V2Member } from "../src-generated/v2-wrapping/library-circulation/index.js";

/**
 * Type assertions over the generated variants.
 *
 * `tsc` alone only says that a variant produces well-formed TypeScript. That is the floor, and a low one: a
 * configuration which quietly has no effect at all passes it just as well as one which works. These
 * assertions raise it to "produces the shape it is supposed to", which is as far as a type check can go.
 *
 * They are checked by `yarn test-compile`, never at runtime - `expectTypeOf` is erased. Hence no `test()`
 * wrapper and no vitest run for this package; the file exists to be compiled.
 *
 * The imports go to the namespace barrels rather than to the root one: the file layout follows the default,
 * which is unbundled, and a root barrel re-exports each namespace under its own name where a model has more
 * than one. Which is itself worth having compiled - it is the shape a user meets by default.
 */

/* --- namingCustom: every naming knob turned away from its default --------------------------------- */

// model suffix `Dto`, PascalCase kept
expectTypeOf<MediumDto>().toBeObject();
// property strategy is snake_case, so a two-word OData name arrives with an underscore
expectTypeOf<MediumDto["publication_date"]>().toEqualTypeOf<string | null>();
// ... and a one-word one is simply lower case
expectTypeOf<MediumDto["title"]>().toEqualTypeOf<string>();

// editable models carry the configured prefix *and* the model suffix, since applyModelNaming is on
expectTypeOf<DraftMediumDto>().toBeObject();
// id models likewise: suffix `Key` plus the model suffix
expectTypeOf<MediumKeyDto>().toEqualTypeOf<string | { id: string }>();
// operation parameter models get their own suffix
expectTypeOf<Medium_ReserveArgsDto>().toBeObject();

// inheritance survives the renaming - a derived model still extends the renamed base
expectTypeOf<BookDto>().toExtend<MediumDto>();

/* --- modelsOnly: mode + the three skip options ---------------------------------------------------- */

// the model itself is there ...
expectTypeOf<ModelsOnlyMedium>().toBeObject();
expectTypeOf<ModelsOnlyMedium["Title"]>().toEqualTypeOf<string>();

/* --- enumStringUnion: a union of string literals plus its member list ------------------------------ */

// the type is the plain union, which is the point of the option
expectTypeOf<UnionAmenities>().toEqualTypeOf<
  "WheelchairAccessible" | "Parking" | "Café" | "KidsArea" | "StudyRoom" | "FullService"
>();
// ... and next to it stands the member list the query objects need, since a union has no runtime form
expectTypeOf<typeof unionAmenityMembers>().toExtend<ReadonlyArray<UnionAmenities>>();
expectTypeOf<UnionBranch["Amenities"]>().toEqualTypeOf<UnionAmenities | null>();

/* --- enumNumeric: enums as numbers ---------------------------------------------------------------- */

// the members are numbers here, where the default would give strings
expectTypeOf<NumericAmenities.Parking>().toExtend<number>();
expectTypeOf<NumericBranch["Amenities"]>().toEqualTypeOf<NumericAmenities | null>();

/* --- v2Wrapping: the extra `results` object ------------------------------------------------------- */

// A V2 collection-valued navigation property arrives wrapped, and this option makes the models say so.
// Only observable in `mode: models` - the option is ignored otherwise, which is why no service exists here
// which could ever send a request.
expectTypeOf<V2Member["Loans"]>().toExtend<{ results: Array<unknown> } | unknown>();

/* --- managedStrict: a second write model, and the services which switch to it ---------------------- */

// A key without an annotation of its own is createOnly, so under strictOmit it follows `nullable` in the
// editable model - required here, where `lenient` would have made it optional regardless.
expectTypeOf<StrictEditableCopy["MediumId"]>().toEqualTypeOf<string>();
expectTypeOf<StrictEditableCopy["InventoryNumber"]>().toEqualTypeOf<number>();

// ... and is dropped from the update model entirely. A composite key, so both parts go: the old heuristic
// looked at single keys only and left this entity with no managed property at all.
expectTypeOf<StrictUpdatableCopy>().not.toHaveProperty("MediumId");
expectTypeOf<StrictUpdatableCopy>().not.toHaveProperty("InventoryNumber");
// everything not createOnly is untouched by the mode
expectTypeOf<StrictUpdatableCopy["IsLoanable"]>().toEqualTypeOf<boolean>();

// A complex property resolves to the nested type's *editable* model, since `PostalAddress` has no
// immutable property of its own and a second, identical type for it would be noise.
expectTypeOf<StrictUpdatableMember["PreviousAddresses"]>().toEqualTypeOf<Array<StrictEditablePostalAddress>>();

// A navigation property always resolves to the referenced entity's editable model, in both write models
// alike - a binding names an entity that exists in its own right, so the create/update split does not
// apply to it. This is also what keeps a self-referential entity graph from ever reaching Updatable.
expectTypeOf<StrictUpdatableMember["IdDocument"]>().toExtend<
  StrictEditableIdDocument | { "@id": unknown } | null | undefined
>();

// The entity service writes with the updatable model, while the collection service, where creation
// happens, keeps the editable one. Both `update` and `patch` take it: neither can change an immutable
// property, so there is no reason for PUT to keep offering one.
expectTypeOf<StrictCopyService["update"]>().parameter(0).toExtend<StrictUpdatableCopy>();
expectTypeOf<StrictCopyService["patch"]>().parameter(0).toExtend<Partial<StrictUpdatableCopy>>();
expectTypeOf<StrictCopyCollectionService["create"]>().parameter(0).toExtend<StrictEditableCopy>();
