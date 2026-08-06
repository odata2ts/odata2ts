import { ODataHttpClient, ODataHttpMethods, ODataRequestConfig } from "@odata2ts/http-client-api";
import { RequestCmd, RequestCmdOptions } from "./RequestCmd";
import { RequestInfo } from "./RequestInfo";

/**
 * Reads binary data (a media entity's content or a stream property) as a stream, so that the payload
 * does not have to be held in memory as a whole - the counterpart to {@link BlobGetRequestCmd}.
 *
 * Not every client can do this: reading a stream requires the fetch API, so the axios and the jquery
 * client refuse the call. Use `getBlob` with those.
 *
 * A stream that exists but carries no content answers 204 - hence `ReadableStream | undefined`.
 * Response converters are not involved: binary data is handed over as it came.
 */
export class StreamGetRequestCmd extends RequestCmd<ReadableStream | undefined> {
  constructor(
    client: ODataHttpClient,
    protected url: string,
    options: RequestCmdOptions<ReadableStream | undefined, undefined> = {},
  ) {
    super(client, ODataHttpMethods.Get, undefined, options);
  }

  public getUrl(): string {
    return this.url;
  }

  protected sendRequest(request: RequestInfo<any>, requestConfig?: ODataRequestConfig) {
    return this.client.getStream(request.url, requestConfig, request.headers);
  }
}
