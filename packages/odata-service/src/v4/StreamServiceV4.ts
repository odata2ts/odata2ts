import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { ODataVersionV4 } from "@odata2ts/odata-core";
import { ODataServiceOptionsInternal } from "../ODataServiceOptions";
import { BlobGetRequestCmd, BlobUpdateRequestCmd, UrlRequestCmd } from "../request";
import { ServiceStateHelper } from "../ServiceStateHelper.js";

const DEFAULT_MIME_TYPE = "application/octet-stream";

/**
 * Access to binary data: a stream property (`Edm.Stream`) or the content of a media entity.
 * Spec: {@link https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_ManagingStreamProperties}
 *
 * Binary data never travels within the entity's JSON payload - it has its own URL, the property name for
 * a stream property and `$value` for a media entity's content, and that URL is what this service is
 * bound to. Which is also why the default headers are deliberately not sent here: they declare JSON.
 */
export class StreamServiceV4<out ClientType extends ODataHttpClient, V extends ODataVersionV4 = "4.0"> {
  protected readonly __base: ServiceStateHelper<ClientType, V>;

  public constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal<V>) {
    this.__base = new ServiceStateHelper(client, basePath, name, options);
  }

  public getPath() {
    return this.__base.path;
  }

  /**
   * Read the binary content.
   *
   * An entity which exists but has no content yet answers 204, so `data` is `undefined` - that is the
   * distinction a client needs to decide whether to upload, and it must not be confused with 404.
   */
  public getBlob() {
    const { client, path } = this.__base;

    return new BlobGetRequestCmd<ClientType>(client, path);
  }

  /**
   * Replace the binary content.
   *
   * The MIME type travels as `Content-Type` and defaults to the blob's own `type`; a blob constructed
   * without one falls back to `application/octet-stream`. Servers differ in what they do with it: some
   * store and return it, others answer with the MIME type declared in their model.
   *
   * @param data the binary content
   * @param mimeType overrides the blob's own type
   */
  public updateBlob(data: Blob, mimeType?: string) {
    const { client, path } = this.__base;

    return new BlobUpdateRequestCmd<ClientType>(client, path, data, mimeType || data.type || DEFAULT_MIME_TYPE);
  }

  /**
   * Delete the binary content, leaving the entity itself in place.
   *
   * Support for this is not universal: a server may serve `GET` and `PUT` on a stream property and still
   * refuse `DELETE` with 405, in which case the content can only be replaced, not removed.
   */
  public deleteBlob() {
    const { client, path } = this.__base;

    return new UrlRequestCmd<ClientType, undefined>(client, ODataHttpMethods.Delete, path);
  }
}
