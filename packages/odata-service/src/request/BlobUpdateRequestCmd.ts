import { ODataHttpClient, ODataHttpMethods, ODataRequestConfig } from "@odata2ts/http-client-api";
import { RequestCmd, RequestCmdOptions } from "./RequestCmd";
import { RequestInfo } from "./RequestInfo";

/**
 * Writes binary data (a media entity's content or a stream property).
 *
 * Dispatches to the client's `updateBlob`, which passes the body through untouched: sent along the
 * generic JSON path, a `Blob` would be serialized - and since it has no enumerable properties, that
 * yields `{}` rather than the file.
 *
 * The response is either empty (204) or the stored content, depending on the server, hence
 * `Blob | undefined`.
 */
export class BlobUpdateRequestCmd extends RequestCmd<Blob | undefined, Blob> {
  constructor(
    client: ODataHttpClient,
    protected url: string,
    data: Blob,
    protected mimeType: string,
    options: RequestCmdOptions<Blob | undefined, Blob> = {},
  ) {
    super(client, ODataHttpMethods.Put, data, options);
  }

  public getUrl(): string {
    return this.url;
  }

  protected sendRequest(request: RequestInfo<any>, requestConfig?: ODataRequestConfig) {
    return this.client.updateBlob(request.url, request.data, this.mimeType, requestConfig, request.headers);
  }
}
