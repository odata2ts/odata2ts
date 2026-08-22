import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { RequestCmdOptions } from "./RequestCmd";
import { UrlRequestCmd } from "./UrlRequestCmd";

/**
 * A request which modifies a resource addressed by a plain URL - `delete` is the one that does.
 *
 * It exists to carry the two controls over optimistic concurrency, which mean nothing on a read: the same
 * reason {@link UrlGetRequestCmd} exists to carry `asPostRequest`.
 */
export class UrlWriteRequestCmd<ResponseStructure, DataStructure = undefined> extends UrlRequestCmd<
  ResponseStructure,
  DataStructure
> {
  constructor(
    client: ODataHttpClient,
    method: ODataHttpMethods,
    url: string,
    data?: DataStructure,
    options: RequestCmdOptions<ResponseStructure, DataStructure> = {},
  ) {
    super(client, method, url, data, options);
  }

  /**
   * State the ETag to write against, instead of letting odata2ts look it up.
   *
   * This is what makes optimistic concurrency usable without the store at all: an application which kept
   * the ETag in its own state, or across a page reload, can write with it without reading the resource
   * again. It is honoured whatever the metadata says about the resource.
   */
  public withETag(etag: string) {
    this.etagOverride = etag;
    return this;
  }

  /**
   * Write regardless of who else changed the resource, by sending `If-Match: *` (OData V4.01 Part 1,
   * §8.2.1). Services may reject it.
   */
  public ignoreETag() {
    this.etagOverride = "*";
    return this;
  }

  /**
   * Overridden so the clone is a write command too: the inherited version names its own class, and would
   * hand back a command that has silently forgotten the ETag just stated on this one.
   */
  public withUrl(url: string) {
    if (!url || !url.trim()) {
      throw new Error("withUrl requires a new URL!");
    }

    const clone = new UrlWriteRequestCmd<ResponseStructure, DataStructure>(
      this.client,
      this.method,
      url,
      this.data,
      this.options,
    );
    clone.etagOverride = this.etagOverride;
    return clone;
  }
}
