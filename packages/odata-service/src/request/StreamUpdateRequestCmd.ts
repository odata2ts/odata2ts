import { ODataHttpClient, ODataHttpMethods, ODataRequestConfig } from "@odata2ts/http-client-api";
import { RequestCmd, RequestCmdOptions } from "./RequestCmd";
import { RequestInfo } from "./RequestInfo";

/**
 * Writes binary data (a media entity's content or a stream property) from a stream, so that the payload
 * does not have to be held in memory as a whole - the counterpart to {@link BlobUpdateRequestCmd}.
 *
 * Not every client can do this: sending a stream requires the fetch API, so the axios and the jquery
 * client refuse the call. Use `updateBlob` with those.
 *
 * The response is either empty (204) or the stored content, depending on the server, hence
 * `ReadableStream | undefined`.
 */
export class StreamUpdateRequestCmd extends RequestCmd<ReadableStream | undefined, ReadableStream> {
  constructor(
    client: ODataHttpClient,
    protected url: string,
    data: ReadableStream,
    protected mimeType: string,
    options: RequestCmdOptions<ReadableStream | undefined, ReadableStream> = {},
  ) {
    super(client, ODataHttpMethods.Put, data, options);
  }

  public getUrl(): string {
    return this.url;
  }

  protected sendRequest(request: RequestInfo<any>, requestConfig?: ODataRequestConfig) {
    return this.client.updateStream(request.url, request.data, this.mimeType, requestConfig, request.headers);
  }
}
