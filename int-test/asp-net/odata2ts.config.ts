import { ConfigFileOptions, EmitModes, Modes } from "@odata2ts/odata2ts";

/**
 * Generates the odata2ts client for the standardized "Library" OData V4 test model, as served by the
 * ASP.NET Core implementation (repo `odata2ts/test-server-asp-net`).
 *
 * The source is a committed snapshot of the server's actual `$metadata` (`resource/library.xml`), so
 * generation stays offline and server-independent - odata2ts is tested against the metadata ASP.NET Core
 * OData really emits, not against the idealized reference model. Notably that metadata has no
 * `TypeDefinition`, no `Partner` attributes and no `SRID` facets, none of which the model builder can
 * express; see FEATURE-COVERAGE.md in the server repo.
 *
 * `enableBindingProps` is on, because this server is the first one we have that actually honours the
 * binding notations - proving them out end to end is the point of this package.
 */
const config: ConfigFileOptions = {
  mode: Modes.service,
  emitMode: EmitModes.ts,
  prettier: true,
  debug: true,
  enableBindingProps: true,
  // on, because the property services are a generator feature of their own and otherwise never
  // meet a real server: see test/feature/PropertyServices.test.ts
  enablePrimitivePropertyServices: true,
  services: {
    library: {
      serviceName: "Library",
      source: "resource/library.xml",
      output: "src-generated/library",
    },
  },
};

export default config;
