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
    },
    libraryV2: {
      serviceName: "LibraryV2",
      source: "resource/library-v2.xml",
      output: "src-generated/library-v2",
    },
  },
};

export default config;
