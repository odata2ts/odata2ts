import { ODataHttpClient, ODataHttpClientConfig, ODataHttpMethods } from "@odata2ts/http-client-api";
import { RequestCmd, RequestCmdOptions } from "./RequestCmd";
import { RequestInfo } from "./RequestInfo";

/**
 * Reads binary data (a media entity's content or a stream property).
 *
 * Dispatches to the client's `getBlob` instead of the generic `request`, since only that reads the
 * response as binary; the JSON path would try to parse the bytes.
 *
 * A stream that exists but carries no content answers 204 - hence `Blob | undefined`. Response
 * converters are not involved: binary data is handed over as it came.
 */
export class BlobGetRequestCmd<ClientType extends ODataHttpClient> extends RequestCmd<ClientType, Blob | undefined> {
  constructor(
    client: ClientType,
    protected url: string,
    options: RequestCmdOptions<Blob | undefined, undefined> = {},
  ) {
    super(client, ODataHttpMethods.Get, undefined, options);
  }

  public getUrl(): string {
    return this.url;
  }

  protected sendRequest(request: RequestInfo<any>, requestConfig?: ODataHttpClientConfig<ClientType>) {
    return this.client.getBlob(request.url, requestConfig, request.headers);
  }
}
