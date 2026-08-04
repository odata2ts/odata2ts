import { expectTypeOf } from "vitest";
import type { Amenities as NumericAmenities, Branch as NumericBranch } from "../src-generated/enum-numeric/index.js";
import type { Medium as ModelsOnlyMedium } from "../src-generated/models-only/index.js";
import type {
  BookDto,
  DraftMediumDto,
  Medium_ReserveArgsDto,
  MediumDto,
  MediumKeyDto,
} from "../src-generated/naming-custom/index.js";
import type { Member as V2Member } from "../src-generated/v2-wrapping/index.js";

/**
 * Type assertions over the generated variants.
 *
 * `tsc` alone only says that a variant produces well-formed TypeScript. That is the floor, and a low one: a
 * configuration which quietly has no effect at all passes it just as well as one which works. These
 * assertions raise it to "produces the shape it is supposed to", which is as far as a type check can go.
 *
 * They are checked by `yarn test-compile`, never at runtime - `expectTypeOf` is erased. Hence no `test()`
 * wrapper and no vitest run for this package; the file exists to be compiled.
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

/* --- enumNumeric: enums as numbers ---------------------------------------------------------------- */

// the members are numbers here, where the default would give strings
expectTypeOf<NumericAmenities.Parking>().toExtend<number>();
expectTypeOf<NumericBranch["Amenities"]>().toEqualTypeOf<NumericAmenities | null>();

/* --- v2Wrapping: the extra `results` object ------------------------------------------------------- */

// A V2 collection-valued navigation property arrives wrapped, and this option makes the models say so.
// Only observable in `mode: models` - the option is ignored otherwise, which is why no service exists here
// which could ever send a request.
expectTypeOf<V2Member["Loans"]>().toExtend<{ results: Array<unknown> } | unknown>();
