import { ConfigFileOptions, EmitModes, Modes, NamingStrategies, TypeModel } from "@odata2ts/odata2ts";

/**
 * The compile gate for odata2ts' configuration surface.
 *
 * odata2ts is a configurable generator, so its configuration is a good part of the product: roughly 25
 * switches plus the nested `naming` settings and the per-type/per-property overrides. A server integration
 * test cannot carry that breadth - every variant there costs Docker, runtime and test code - while most of
 * those options never reach the wire at all. They only change the *shape* of the generated code, and for
 * that a type check is the appropriate judge.
 *
 * So this package generates the same model over and over, once per configuration, and does nothing but
 * `tsc` over the result. No server, no Docker, no runtime: it plugs into the ordinary `yarn build` +
 * `yarn test-compile` of the repository root and therefore runs in the plain unit-test CI job.
 *
 * Two things are essential for it to be worth anything:
 *
 * - **`debug: true` everywhere.** Without it the generator writes `// @ts-nocheck` into every emitted file,
 *   and a type check over such output happily confirms code which does not compile. That is not a weaker
 *   gate, it is a worthless one.
 * - **`src-generated` is in the tsconfig's `include`** (see tsconfig.json), so files nobody imports are
 *   checked as well.
 *
 * The variants follow n+1 rather than 2^n: one variant per axis against the baseline, plus a single
 * "everything on" one to catch interactions. A real matrix would not only be expensive, it would be hard to
 * read - with a failure, no one could tell which axis caused it.
 *
 * What is deliberately **not** here:
 *
 * - `bundledFileGeneration`: covered at runtime instead, `int-test/asp-net` generates unbundled while
 *   `int-test/cap` keeps the bundled default. Both states of the axis are exercised by suites which run
 *   anyway, which is more than a type check would show.
 * - Anything whose effect is on the wire (`enableBindingProps`, `odataVersionV4`, `v4BigNumberAsString`, …):
 *   a type check cannot see a URL or a payload. Those belong to the server packages.
 * - `emitMode` other than `ts`: compiled JS/DTS output is not what `tsc` reads here. That is the CLI test's
 *   business.
 *
 * The sources are the committed metadata snapshots of the server packages, referenced rather than copied so
 * they cannot drift apart.
 */

/** V4: the "Library" model as ASP.NET Core OData emits it. */
const V4_SOURCE = "../asp-net/resource/library.xml";
/** V2: the same model as Apache Olingo 2 emits it. */
const V2_SOURCE = "../olingo-v2/resource/library-v2.xml";

/**
 * `Location_` (a shelf mark) and `Location` (the branch an item sits in) are distinct OData names which
 * collapse onto one another under any casing strategy. The generator refuses to emit that - see odata2ts#440
 * - so every renaming variant has to say which of the two gives way.
 */
const RESOLVE_LOCATION_CLASH = [{ name: "Location_", mappedName: "ShelfLocation" }];

const config: ConfigFileOptions = {
  emitMode: EmitModes.ts,
  prettier: true,
  // mandatory, see above: without it every generated file carries `@ts-nocheck` and the gate proves nothing
  debug: true,
  services: {
    /**
     * The baseline: plain defaults, so the other variants have something to be a variant *of*.
     */
    baseline: {
      serviceName: "Baseline",
      source: V4_SOURCE,
      output: "src-generated/baseline",
    },

    /**
     * `mode: models` with everything skippable skipped. The three `skip*` options only take effect in
     * `models` and `qobjects` mode, so this is the only place they can be observed at all.
     */
    modelsOnly: {
      serviceName: "ModelsOnly",
      source: V4_SOURCE,
      output: "src-generated/models-only",
      mode: Modes.models,
      skipEditableModels: true,
      skipIdModels: true,
      skipOperations: true,
      skipComments: true,
    },

    /**
     * `mode: qobjects` - models plus query objects, but no service. The interesting part is that the query
     * objects have to stand on their own here, without the service layer which normally consumes them.
     */
    qObjectsOnly: {
      serviceName: "QObjectsOnly",
      source: V4_SOURCE,
      output: "src-generated/q-objects-only",
      mode: Modes.qobjects,
    },

    /**
     * The naming surface, turned as far away from the defaults as it goes: another strategy for every kind
     * of artefact, and prefixes and suffixes which are not the built-in ones.
     *
     * This is where `allowRenaming` shows its two faces. Artefact names - models, query objects, services,
     * files - never reach the wire, so they are pure shape and belong here. Property names do reach it, as
     * the mapping between the TypeScript name and the OData one; that mapping needs a server and lives in
     * `int-test/asp-net`. What this variant adds is the *type* side of it: whether a thoroughly renamed
     * model still forms a client which compiles.
     */
    namingCustom: {
      serviceName: "NamingCustom",
      source: V4_SOURCE,
      output: "src-generated/naming-custom",
      allowRenaming: true,
      propertiesByName: RESOLVE_LOCATION_CLASH,
      naming: {
        models: {
          namingStrategy: NamingStrategies.PASCAL_CASE,
          propNamingStrategy: NamingStrategies.SNAKE_CASE,
          suffix: "Dto",
          editableModels: { prefix: "Draft", suffix: "", applyModelNaming: true },
          idModels: { prefix: "", suffix: "Key", applyModelNaming: true },
          operationParamModels: { prefix: "", suffix: "Args", applyModelNaming: true },
          fileName: { namingStrategy: NamingStrategies.SNAKE_CASE, prefix: "", suffix: "_model" },
        },
        queryObjects: {
          namingStrategy: NamingStrategies.PASCAL_CASE,
          propNamingStrategy: NamingStrategies.SNAKE_CASE,
          prefix: "Query",
          suffix: "",
          idFunctions: { prefix: "", suffix: "KeyFn" },
        },
        services: {
          namingStrategy: NamingStrategies.PASCAL_CASE,
          suffix: "Api",
          collection: { prefix: "", suffix: "ListApi", applyServiceNaming: false },
          relatedServiceGetter: { prefix: "navigateTo", suffix: "" },
          privateProps: { prefix: "__", suffix: "" },
        },
      },
    },

    /**
     * Enums as a plain string union instead of a TypeScript enum. Pure type shape: the values stay the very
     * same strings, so nothing about the wire changes.
     *
     * The full mode on purpose, query objects included. That combination did not compile until the first
     * run of this package surfaced it: a union of string literals exists only in the type system, while the
     * query object needs something at runtime. The generator now emits the member list alongside the type
     * alias, under the same name, and `QEnumPath` takes either shape.
     */
    enumStringUnion: {
      serviceName: "EnumStringUnion",
      source: V4_SOURCE,
      output: "src-generated/enum-string-union",
      enumType: "string-union",
    },

    /**
     * Numeric enums. This one looks like formatting and is not: the wire wants the member *name*, so a
     * numeric enum needs a mapping in between, exactly like a renamed property does. The type check is the
     * floor here, not the proof - what it can show is that the query objects and models agree on the
     * numeric representation.
     */
    enumNumeric: {
      serviceName: "EnumNumeric",
      source: V4_SOURCE,
      output: "src-generated/enum-numeric",
      enumType: "numeric",
    },

    /**
     * The V2 `results` wrapping, in both its read and its write flavour.
     *
     * These two options are the one case which is structurally impossible to test against a server: they
     * only take effect in `mode: models` and are ignored otherwise, and in that mode no service exists which
     * could send a request. So the compile gate is not the cheaper home for them, it is the only one.
     *
     * They are deliberately two options rather than one: a service which answers with the extra wrapping
     * does not necessarily expect it in a request payload (odata2ts#237).
     */
    v2Wrapping: {
      serviceName: "V2Wrapping",
      source: V2_SOURCE,
      output: "src-generated/v2-wrapping",
      mode: Modes.models,
      v2ModelsWithExtraResultsWrapping: true,
      v2EditableModelsWithExtraResultsWrapping: true,
    },

    /**
     * Everything at once - the interaction catcher of the n+1 scheme.
     *
     * Each variant above isolates a single axis, which is what makes a failure attributable. That leaves
     * the case where two options are individually fine and jointly are not, and this is the one variant
     * whose job is to fail in that case. The wire-affecting options are included here too: not because a
     * type check could judge them, but because they change the generated surface and thus can collide with
     * the rest.
     */
    everythingOn: {
      serviceName: "EverythingOn",
      source: V4_SOURCE,
      output: "src-generated/everything-on",
      allowRenaming: true,
      propertiesByName: RESOLVE_LOCATION_CLASH,
      byTypeAndName: [{ name: "PublisherRegistry.Branch", type: TypeModel.EntityType, mappedName: "PublisherBranch" }],
      enumType: "numeric",
      enableBindingProps: true,
      enableDeepInsertProps: true,
      enablePrimitivePropertyServices: true,
      enableNativeInOperator: true,
      v4BigNumberAsString: true,
      odataVersionV4: "4.01",
      disableAutoManagedKey: true,
      skipComments: true,
    },
  },
};

export default config;
