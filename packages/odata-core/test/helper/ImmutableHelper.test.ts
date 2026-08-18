import { expectTypeOf } from "vitest";
import type { Immutable, Updatable } from "../../src/helper/ImmutableHelper.js";

/**
 * Type assertions over `Updatable<T>`. Checked by `yarn test-compile` via `tsc` - `expectTypeOf` is erased,
 * so there is no `test()` wrapper and no vitest run for this file, only a compile.
 */

// primitives pass through untouched
expectTypeOf<Updatable<string>>().toEqualTypeOf<string>();

interface Author extends Immutable<"authorId"> {
  authorId: string;
  name: string;
}

interface Book extends Immutable<"id"> {
  id: string;
  title: string;
  author: Author;
}

interface Library {
  books: Array<Book>;
}

// the key (and only the key) is dropped, the phantom marker along with it
expectTypeOf<Updatable<Author>>().toEqualTypeOf<{ name: string }>();

// immutability is filtered per model - a nested complex/navigation property is recursed into on its own terms
expectTypeOf<Updatable<Book>>().toEqualTypeOf<{ title: string; author: { name: string } }>();

// a plain object with no `Immutable` marker of its own still recurses into its properties
expectTypeOf<Updatable<Library>>().toEqualTypeOf<{ books: Array<{ title: string; author: { name: string } }> }>();

// arrays are unwrapped and mapped element-wise, not treated as an opaque leaf
expectTypeOf<Updatable<Array<Book>>>().toEqualTypeOf<Array<{ title: string; author: { name: string } }>>();

interface Ordered extends Immutable<"code" | "revision"> {
  code: string;
  revision: number;
  label: string;
}

// several immutable properties named by a union of keys are all dropped together
expectTypeOf<Updatable<Ordered>>().toEqualTypeOf<{ label: string }>();
