import { ODataHttpClient } from "@odata2ts/http-client-api";
import { ODataVersionV4 } from "@odata2ts/odata-core";
import { BatchBuilder, JsonBatchBuilder, MultipartBatchBuilder } from "./batch/BatchBuilder.js";
import { ODataServiceOptionsInternal } from "./ODataServiceOptions";
import { ServiceStateHelper } from "./ServiceStateHelper.js";

/**
 * The base class for the main OData service client.
 *
 * @template V The odata version of the service
 * @template TBuilder The {@link BatchBuilder} a generated service is stamped with - the wire format fixed at
 * generation time, so {@link batch} returns a builder whose `add` matches that format (a JSON one may name
 * `dependsOn`, a multipart one may not).
 */
export class ODataService<V extends ODataVersionV4 = "4.0", TBuilder = MultipartBatchBuilder<[]>> {
  protected readonly __base: ServiceStateHelper<V>;

  /**
   * Takes the internal options, so that generated main services can pass on what the generator decided,
   * e.g. the OData version. Users only get to see the public options via the generated service.
   */
  constructor(client: ODataHttpClient, basePath: string, options?: ODataServiceOptionsInternal<ODataVersionV4>) {
    if (!client) {
      throw new Error("[client] must be supplied to ODataService!");
    }
    if (!basePath || !basePath.trim()) {
      throw new Error("[basePath] must be supplied to ODataService!");
    }
    // the version is data at runtime; which one the types assume is decided by V, i.e. by the generator
    this.__base = new ServiceStateHelper(client, basePath, undefined, options as ODataServiceOptionsInternal<V>);
  }

  public getPath(): string {
    return this.__base.path;
  }

  /**
   * Starts collecting requests to send them as one `$batch`.
   *
   * The builder applies the service's `batch` option: it refuses to be built at all where the feature was
   * switched off. The wire format is the `TBuilder` the service is stamped with at generation - a JSON batch is
   * built where that format is configured, a multipart batch otherwise.
   *
   * The result is a tuple, element-for-element the type the application would get from running those
   * requests one by one, so the answer of a slot that never ran is `T | undefined` rather than a second,
   * batch-specific shape.
   */
  public batch(): TBuilder {
    const batchOptions = this.__base.options.batch;
    if (batchOptions?.disabled) {
      throw new Error("Batch requests are disabled for this service (see the `batch` option).");
    }

    const builder =
      batchOptions?.format === "json"
        ? new JsonBatchBuilder(this.__base.client, this.__base.basePath)
        : new MultipartBatchBuilder(this.__base.client, this.__base.basePath);
    return builder as unknown as TBuilder;
  }
}
