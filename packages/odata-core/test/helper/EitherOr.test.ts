import { expectTypeOf } from "vitest";
import type { EitherOr, Only } from "../../src/helper/EitherOr.js";

/**
 * Type assertions over `Only<T, U>` and `EitherOr<T, U>`. Checked by `yarn test-compile` via `tsc` -
 * `expectTypeOf` is erased, so there is no `test()` wrapper and no vitest run for this file, only a compile.
 */

interface Prefixed {
  "@odata.type": string;
  "@odata.count": number;
}

interface Short {
  "@type": string;
  "@count": number;
}

/* --- Only<T, U> ------------------------------------------------------------------------------------ */

// T's own properties survive untouched, U's exclusive ones are added back as forbidden (optional `never`)
expectTypeOf<Only<Prefixed, Short>>().toEqualTypeOf<Prefixed & { "@type"?: never; "@count"?: never }>();

interface WithId {
  id: string;
}

interface OtherWithId {
  id: number;
  extra: boolean;
}

// a key shared by both sides is never touched - it keeps T's own type, not U's, and is not forbidden
expectTypeOf<Only<WithId, OtherWithId>>().toEqualTypeOf<WithId & { extra?: never }>();

/* --- EitherOr<T, U> ---------------------------------------------------------------------------------- */

type ControlInfo = EitherOr<Prefixed, Short>;

// every property of either side can be read regardless of which one is actually present, per the doc comment
expectTypeOf<ControlInfo["@odata.count"]>().toEqualTypeOf<number | undefined>();
expectTypeOf<ControlInfo["@count"]>().toEqualTypeOf<number | undefined>();

// either spelling on its own describes a valid payload
const prefixedOnly: ControlInfo = { "@odata.type": "Book", "@odata.count": 1 };
const shortOnly: ControlInfo = { "@type": "Book", "@count": 1 };

// but never a mix of both - that is the entire point of the type
// @ts-expect-error - mixing the two spellings does not describe any real payload
const mixed: ControlInfo = { "@odata.type": "Book", "@odata.count": 1, "@type": "Book", "@count": 1 };
