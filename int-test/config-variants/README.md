# Compile Gate: configuration variants

Generates the standardized "Library" model over and over, once per configuration, and does nothing with
the result but type-check it.

```bash
yarn workspace @odata2ts/int-test-config-variants build
yarn workspace @odata2ts/int-test-config-variants test-compile
```

No server, no Docker, no runtime. The package plugs into the ordinary `yarn build` and `yarn test-compile`
of the repository root, so it runs in the plain unit-test CI job without any workflow change.

## Why it exists

odata2ts is a configurable generator, which makes its configuration a good part of the product: roughly 25
switches plus the nested `naming` settings and the per-type and per-property overrides. The server
integration tests cannot carry that breadth - every variant there costs Docker, runtime and test code - and
for most of those options a server would prove nothing anyway, because they never reach the wire. They only
change the *shape* of the generated code, and a type check is the appropriate judge of that.

So this is the cheap, wide layer underneath the server packages: one generation plus one `tsc` per variant.

## What it can and cannot show

`tsc` alone only says that a variant produces well-formed TypeScript. That is a low floor - a configuration
which quietly has no effect at all clears it just as easily as one which works. `test/variants.type-test.ts`
raises it to "produces the shape it is supposed to" with `expectTypeOf` assertions, which is as far as a
type check goes. Those assertions are checked by `test-compile`, never at runtime; `expectTypeOf` is erased,
which is why this package has no `test` script and no vitest run.

What it cannot show is semantics. "Compiles" is not "works": whether a renamed property still reaches the
server under its OData name, whether a converter round-trips, whether a URL is one the service resolves -
none of that is visible here. That is what `int-test/asp-net`, `int-test/cap` and `int-test/olingo-v2` are
for.

Two things are essential for the gate to be worth anything at all:

- **`debug: true` in every variant.** Without it the generator writes `// @ts-nocheck` into every emitted
  file, and a type check over such output happily confirms code which does not compile. That is not a
  weaker gate, it is a worthless one.
- **`src-generated` in the tsconfig's `include`**, so that generated files nobody imports get checked too.

## The variants

One variant per axis against the baseline, plus a single "everything on" one - `n+1`, not `2^n`. A real
matrix would not only be expensive, it would be unreadable: with a failure, nobody could tell which axis
caused it.

| Variant | Axis |
| --- | --- |
| `baseline` | plain defaults, so the others have something to be a variant *of* |
| `modelsOnly` | `mode: models` with `skipEditableModels`, `skipIdModels`, `skipOperations`, `skipComments` - the skip options only take effect in this mode |
| `qObjectsOnly` | `mode: qobjects` - query objects standing on their own, without the service layer which normally consumes them |
| `namingCustom` | every naming knob turned away from its default: another strategy per artefact kind, own prefixes and suffixes, `allowRenaming` |
| `enumStringUnion` | `enumType: "string-union"` |
| `enumNumeric` | `enumType: "numeric"` |
| `v2Wrapping` | `v2ModelsWithExtraResultsWrapping` and its editable counterpart, on the V2 model |
| `everythingOn` | all of it at once - the interaction catcher |

The sources are the committed metadata snapshots of `int-test/asp-net` and `int-test/olingo-v2`, referenced
rather than copied so they cannot drift apart.

### Deliberately not here

- **`bundledFileGeneration`**: covered at runtime instead - `int-test/asp-net` generates unbundled while
  `int-test/cap` keeps the bundled default. Both states are exercised by suites which run anyway, which is
  more than a type check would show.
- **Anything whose effect is on the wire** (`enableBindingProps`, `odataVersionV4`, `v4BigNumberAsString`,
  …): a type check cannot see a URL or a payload. `everythingOn` switches several of them on, but only
  because they change the generated surface and can therefore collide with the rest - not as coverage.
- **`emitMode` other than `ts`**: compiled JS/DTS output is not what `tsc` reads here. That is the CLI
  test's business.
- **`disableAutomaticNameClashResolution`**: its whole effect is to turn a resolvable clash into an error,
  so there is no output to type-check. Covered by unit tests instead.

## What its first run turned up

Two generator defects, both of which had gone unnoticed because no test generated under those options:

- **`enableNativeInOperator` produced code which does not compile for any model with an `Edm.Binary`
  property.** The options argument was appended to every non-collection, non-model, non-enum path,
  including `QBinaryPath` - which extends `QNoopPath` and takes a path and a converter, nothing else.
- **`enumType: "string-union"` could not produce a working client for any model carrying an enum
  property at all.** The model emitted `export type Amenities = "…" | "…"`, a type alias, while the query
  object handed that alias over to `QEnumPath` as a *value*. A union of string literals exists only in
  the type system.

Both are fixed. For the second one the generator now emits the member list next to the type alias, under
the same name - a type and a value of one name coexist, so every use site stays as it was - and
`QEnumPath` accepts either shape, since a string enum needs no runtime lookup anyway: its members already
are the values which go on the wire.
