import { expectTypeOf } from "vitest";
import type {
  CopiesId as CapCopiesId,
  EditableAudiobookChapters as CapEditableAudiobookChapters,
  EditableAudiobooks as CapEditableAudiobooks,
  EditableBooks as CapEditableBooks,
  PublishersId as CapPublishersId,
} from "../src-generated/deep-insert-composition-cap/library-service/index.js";
import type { EditableMember as CompositionV2EditableMember } from "../src-generated/deep-insert-composition-v2/library-circulation/index.js";
import type {
  Audiobook as CompositionAudiobook,
  EditableAudiobook as CompositionEditableAudiobook,
  EditableAudiobookChapter as CompositionEditableAudiobookChapter,
  EditableBook as CompositionEditableBook,
} from "../src-generated/deep-insert-composition/library-catalog/index.js";
import type { Amenities as NumericAmenities } from "../src-generated/enum-numeric/library-catalog/index.js";
import type { Branch as NumericBranch } from "../src-generated/enum-numeric/library-circulation/index.js";
import { Amenities as unionAmenityMembers } from "../src-generated/enum-string-union/library-catalog/index.js";
import type { Amenities as UnionAmenities } from "../src-generated/enum-string-union/library-catalog/index.js";
import type { Branch as UnionBranch } from "../src-generated/enum-string-union/library-circulation/index.js";
import type { EditableMedium as AllComputedEditableMedium } from "../src-generated/key-all-computed/library-catalog/index.js";
import type { EditableCopy as AllComputedEditableCopy } from "../src-generated/key-all-computed/library-circulation/index.js";
import type {
  EditableCopy as KeyStrictEditableCopy,
  UpdatableCopy as KeyStrictUpdatableCopy,
} from "../src-generated/key-strict/library-circulation/index.js";
import type { EditablePostalAddress as StrictEditablePostalAddress } from "../src-generated/managed-strict/library-catalog/index.js";
import type {
  CopyCollectionService as StrictCopyCollectionService,
  CopyService as StrictCopyService,
  EditableBranch as StrictEditableBranch,
  EditableCopy as StrictEditableCopy,
  UpdatableBranch as StrictUpdatableBranch,
  UpdatableCopy as StrictUpdatableCopy,
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

// A key without an annotation of its own is createOnly, but the default `keyProperties` will not demand
// one on create - `managedPropertyMode` says nothing about that half, so both parts stay optional here.
expectTypeOf<StrictEditableCopy["MediumId"]>().toEqualTypeOf<string | undefined>();
expectTypeOf<StrictEditableCopy["InventoryNumber"]>().toEqualTypeOf<number | undefined>();

// ... while the update model drops them entirely, which is what `strictOmit` is for. A composite key, so
// both parts go - `keyProperties` treats every part of one alike.
expectTypeOf<StrictUpdatableCopy>().not.toHaveProperty("MediumId");
expectTypeOf<StrictUpdatableCopy>().not.toHaveProperty("InventoryNumber");
// everything not createOnly is untouched by the mode
expectTypeOf<StrictUpdatableCopy["IsLoanable"]>().toEqualTypeOf<boolean>();

// Only three types have an updatable model at all, and that is the point: `Branch` and `Copy` because
// their keys are the client's and therefore immutable, `Loan` because of `Core.Immutable` on LoanedAt.
// Every other key is `Core.Computed` - readOnly, dropped from both write models, so nothing differs.

// A complex property resolves to the nested type's *editable* model, since `PostalAddress` has no
// immutable property of its own and a second, identical type for it would be noise.
expectTypeOf<StrictUpdatableBranch["Address"]>().toEqualTypeOf<StrictEditablePostalAddress | null | undefined>();

// A navigation property always resolves to the referenced entity's editable model, in both write models
// alike - a binding names an entity that exists in its own right, so the create/update split does not
// apply to it. This is also what keeps a self-referential entity graph from ever reaching Updatable.
expectTypeOf<StrictUpdatableCopy["Location"]>().toExtend<
  StrictEditableBranch | { "@id": unknown } | null | undefined
>();

// The entity service writes with the updatable model, while the collection service, where creation
// happens, keeps the editable one. Both `update` and `patch` take it: neither can change an immutable
// property, so there is no reason for PUT to keep offering one.
expectTypeOf<StrictCopyService["update"]>().parameter(0).toExtend<StrictUpdatableCopy>();
expectTypeOf<StrictCopyService["patch"]>().parameter(0).toExtend<Partial<StrictUpdatableCopy>>();
expectTypeOf<StrictCopyCollectionService["create"]>().parameter(0).toExtend<StrictEditableCopy>();

/* --- keyStrict: the spec-conformant reading of an unannotated key ---------------------------------- */

// `strict` is the other half of the pair: the very same key, now required on create because it is
// non-nullable and nothing says the server supplies it.
expectTypeOf<KeyStrictEditableCopy["MediumId"]>().toEqualTypeOf<string>();
expectTypeOf<KeyStrictEditableCopy["InventoryNumber"]>().toEqualTypeOf<number>();
// and relaxed again on update, since the server will not change a key whatever the payload says
expectTypeOf<KeyStrictUpdatableCopy["MediumId"]>().toEqualTypeOf<string | undefined>();

/* --- keyAllComputed + strictOmit: the key disappears from the write models ------------------------- */

// The two options meeting: `allComputed` makes every key the server's, `strictOmit` takes what the server
// owns out of the models rather than leaving it there optional. Under `lenient` it would still be present.
expectTypeOf<AllComputedEditableCopy>().not.toHaveProperty("MediumId");
expectTypeOf<AllComputedEditableCopy>().not.toHaveProperty("InventoryNumber");
// a `Core.Computed` property goes the same way, being readOnly for the same reason
expectTypeOf<AllComputedEditableMedium>().not.toHaveProperty("PopularityScore");

/* --- deepInsertComposition: containment decides which navigation property carries a deep insert ---- */

// `Audiobook` is the one entity in the model with both kinds of relation, which is what makes it the
// case worth pinning: `Chapters` is contained - the target has no entity set of its own - while `Copies`
// is a plain navigation property to an entity standing on its own.
expectTypeOf<CompositionEditableAudiobook["Chapters"]>().toEqualTypeOf<
  Array<CompositionEditableAudiobookChapter> | undefined
>();
expectTypeOf<CompositionEditableAudiobook>().not.toHaveProperty("Copies");
// nothing is contained anywhere else, so no editable model offers a deep insert at all
expectTypeOf<CompositionEditableBook>().not.toHaveProperty("Copies");
expectTypeOf<CompositionEditableBook>().not.toHaveProperty("Publisher");

// The read model is untouched: containment says how an entity is addressed, not how it is read, and this
// option speaks about write payloads alone.
expectTypeOf<CompositionAudiobook["Copies"]>().toExtend<Array<unknown> | undefined>();

/* --- deepInsertCompositionV2: the same value, doing nothing at all -------------------------------- */

// V2 states no containment, so the narrow reading would find nothing contained and take the feature away
// wholesale. A V2 service is exempt from the option instead, and keeps every navigation property.
expectTypeOf<CompositionV2EditableMember["Loans"]>().toExtend<Array<unknown> | undefined>();
expectTypeOf<CompositionV2EditableMember["Reservations"]>().toExtend<Array<unknown> | undefined>();

/* --- deepInsertCompositionCap: the same value against the server it exists for -------------------- */

// The composition CAP marks `@odata.contained` keeps the deep insert shape, because that is the one
// relationship CAP writes deeply.
expectTypeOf<CapEditableAudiobooks["Chapters"]>().toEqualTypeOf<Array<CapEditableAudiobookChapters> | undefined>();

// The associations keep their binding and lose the nested entity - which is the point of the option
// here: a nested payload on `Copies` is answered by CAP with a silent no-op and one on `Publisher` with a
// 400, while binding an existing entity works on both. The type now permits only the half that works.
expectTypeOf<CapEditableAudiobooks["Copies"]>().toEqualTypeOf<Array<{ "@id": CapCopiesId }> | undefined>();
expectTypeOf<CapEditableBooks["Publisher"]>().toEqualTypeOf<{ "@id": CapPublishersId } | null | undefined>();

// Containment reshapes the contained type as well: a chapter is identified within its audiobook, so CAP
// drops the foreign key to the parent. Before the composition was annotated, the editable model demanded
// an `up__Id` for an audiobook that did not exist yet.
expectTypeOf<CapEditableAudiobookChapters>().not.toHaveProperty("up__Id");
