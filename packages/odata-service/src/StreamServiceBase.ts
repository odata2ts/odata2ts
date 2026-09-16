import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { ODataVersionV4 } from "@odata2ts/odata-core";
import { ODataServiceOptionsInternal } from "./ODataServiceOptions";
import {
  BlobGetRequestCmd,
  BlobUpdateRequestCmd,
  StreamGetRequestCmd,
  StreamUpdateRequestCmd,
  UrlRequestCmd,
} from "./request";
import { ServiceStateHelper } from "./ServiceStateHelper.js";

const DEFAULT_MIME_TYPE = "application/octet-stream";

/**
 * Access to binary data behind its own URL, shared by both OData versions.
 *
 * Binary data never travels within the entity's JSON payload - it has its own URL, and that URL is what
 * this service is bound to. Which is also why the default headers are deliberately not sent here: they
 * declare JSON. What the URL looks like is the versions' business, not this class's: V4 knows a stream
 * property as well as a media entity's `$value`, V2 only the latter.
 */
export abstract class StreamServiceBase<V extends ODataVersionV4 = "4.0"> {
  protected readonly __base: ServiceStateHelper<V>;

  public constructor(
    client: ODataHttpClient,
    basePath: string,
    name: string,
    options?: ODataServiceOptionsInternal<V>,
  ) {
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

    return new BlobGetRequestCmd(client, path);
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

    return new BlobUpdateRequestCmd(client, path, data, mimeType || data.type || DEFAULT_MIME_TYPE);
  }

  /**
   * Read the binary content as a stream, so that it does not have to be held in memory as a whole.
   *
   * Same request as {@link getBlob}, only the response is not buffered. Reading a stream requires the
   * fetch API, so the axios and the jquery client refuse this call - use `getBlob` with those.
   *
   * An entity which exists but has no content yet answers 204, so `data` is `undefined`.
   */
  public getStream() {
    const { client, path } = this.__base;

    return new StreamGetRequestCmd(client, path);
  }

  /**
   * Replace the binary content from a stream, so that it does not have to be held in memory as a whole.
   *
   * Same request as {@link updateBlob}, only the body is streamed. Sending a stream requires the fetch
   * API, so the axios and the jquery client refuse this call - use `updateBlob` with those.
   *
   * Unlike a blob a stream carries no MIME type of its own, hence the fallback to
   * `application/octet-stream` when none is given.
   *
   * @param data the binary content
   * @param mimeType the content's MIME type
   */
  public updateStream(data: ReadableStream, mimeType?: string) {
    const { client, path } = this.__base;

    return new StreamUpdateRequestCmd(client, path, data, mimeType || DEFAULT_MIME_TYPE);
  }

  /**
   * Delete the binary content, leaving the entity itself in place.
   *
   * Support for this is not universal: a server may serve `GET` and `PUT` on a stream property and still
   * refuse `DELETE` with 405, in which case the content can only be replaced, not removed.
   */
  public deleteBlob() {
    const { client, path } = this.__base;

    return new UrlRequestCmd<undefined>(client, ODataHttpMethods.Delete, path);
  }
}
