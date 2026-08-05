import { ConfigFileOptions, EmitModes, Modes } from "@odata2ts/odata2ts";

/**
 * Generates the odata2ts clients for the standardized "Library" test model, as served by the SAP CAP
 * implementation (repo `odata2ts/test-server-cap`) - once as OData V4 and once as OData V2.
 *
 * The sources are committed snapshots of the server's actual `$metadata` (`resource/library.xml` and
 * `resource/library-v2.xml`), so generation stays offline and server-independent - odata2ts is
 * deliberately tested against the metadata CAP really emits (flat mode, aspect-based media hierarchy,
 * alternate keys only in metadata, ...), not against the idealized reference model. Refresh the
 * snapshots from the running server (or the server repo's `npm run metadata`) whenever the model changes.
 *
 * The V2 model is not a second model: it is the very same service, translated on the fly by the
 * `@cap-js-community/odata-v2-adapter` middleware that CAP runs in front of its V4 endpoint. Everything
 * the V2 client sees is therefore that translation - which is exactly what makes it worth testing, since
 * it is the shape SAP systems actually put on the wire. See test/v2/ and the server repo's
 * FEATURE-COVERAGE-V2.md.
 */
const config: ConfigFileOptions = {
  mode: Modes.service,
  emitMode: EmitModes.ts,
  prettier: true,
  // we definitely want to type check the generated artifacts
  debug: true,
  // on, because the property services are a generator feature of their own and otherwise never
  // meet a real server: see test/feature/PropertyServices.test.ts
  enablePrimitivePropertyServices: true,
  // on, because a deep insert can only be proven against a server that actually stores the nested
  // entities: see test/feature/DeepInsert.test.ts
  enableDeepInsertProps: true,
  // on, because a binding by key is only proven when a server resolves the URL the query objects build
  // from it - and this is the only V2 server we have: see test/feature/Binding.test.ts and
  // test/v2/feature/Binding.test.ts
  enableBindingProps: true,
  services: {
    library: {
      serviceName: "Library",
      source: "resource/library.xml",
      output: "src-generated/library",
      // V4 only, and on here rather than in `int-test/asp-net`, which keeps the emulating default: the
      // option has exactly two states and both are worth having against a real server, so they are split
      // across the two V4 packages instead of duplicating a suite. `test/core/QueryFunctionality.test.ts`
      // covers it on either side - the assertion differs only in the URL that reaches the server.
      enableNativeInOperator: true,
    },
    /**
     * The V4 model a second time, with converters switched on.
     *
     * Converters had only ever met a real server as V2, through `int-test/olingo-v2`, and V2 is a
     * different problem: there every timestamp arrives as `/Date(<ticks>)/` and every wide numeric type as
     * a string, so the raw client types them as `string` and the converter has something to parse. V4 hands
     * over real ISO values - and types `Edm.Decimal` and `Edm.Int64` as `number`, which is precisely where
     * precision goes missing without anyone noticing.
     *
     * `v4BigNumberAsString` belongs with them rather than being its own variant: it asks the server for
     * those two types as strings (`IEEE754Compatible` in accept and content-type). Without it the converter
     * would be handed a number which has already lost its precision, and converting that is pointless. The
     * two options only mean anything together.
     *
     * Generated separately rather than replacing the raw client, because both halves are the point: the raw
     * one shows what the server actually sends, the converted one what the converters make of it. See
     * test/feature/Converters.test.ts.
     */
    libraryConverted: {
      serviceName: "LibraryConverted",
      source: "resource/library.xml",
      output: "src-generated/library-converted",
      v4BigNumberAsString: true,
      converters: [
        "@odata2ts/converter-luxon",
        "@odata2ts/converter-big-number",
        { module: "@odata2ts/converter-common", use: ["int64ToBigIntConverter"] },
      ],
    },
    libraryV2: {
      serviceName: "LibraryV2",
      source: "resource/library-v2.xml",
      output: "src-generated/library-v2",
    },
  },
};

export default config;
