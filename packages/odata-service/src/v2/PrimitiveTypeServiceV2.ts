import { ValueConverter } from "@odata2ts/converter-api";
import { ODataHttpClient, ODataHttpClientConfig, ODataResponse } from "@odata2ts/http-client-api";
import { ODataValueResponseV2 } from "@odata2ts/odata-core";
import { ConvertibleV2, convertV2ValueResponse } from "@odata2ts/odata-query-objects";
import { getIdentityConverter } from "@odata2ts/odata-query-objects/lib/IdentityConverter";

import { DEFAULT_HEADERS } from "../RequestHeaders";

const RAW_VALUE_SUFFIX = "/$value";

const OPEN_ACCEPT_HEADER = { accept: "*/*" };
const DEFAULT_STREAM_MIME_TYPE = "application/octet-stream";

export class PrimitiveTypeServiceV2<ClientType extends ODataHttpClient, T> {
  private readonly converter: ConvertibleV2;

  public constructor(
    private readonly client: ODataHttpClient,
    private readonly basePath: string,
    private readonly name: string,
    mappedName?: string,
    { convertTo, convertFrom }: ValueConverter<any, any> = getIdentityConverter()
  ) {
    this.converter = {
      convertFrom,
      convertTo,
      getName() {
        return name;
      },
      getMappedName() {
        return mappedName || name;
      },
    };
  }

  public getPath() {
    return this.basePath && this.name ? this.basePath + "/" + this.name : this.basePath ? this.basePath : this.name;
  }

  /**
   * Requesting a <code>null</code> value results in 204 (No Content).
   * This makes the value undefined.
   *
   * @param requestConfig
   */
  public async getValue(
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): ODataResponse<void | ODataValueResponseV2<T>> {
    const result = await this.client.get(this.getPath(), requestConfig, this.getDefaultHeaders());
    return convertV2ValueResponse(result, this.converter);
  }

  /*public async getRawValue(requestConfig?: ODataHttpClientConfig<ClientType>): ODataResponse<any> {
    return this.client.get(this.getPath() + RAW_VALUE_SUFFIX, requestConfig, { headers: OPEN_ACCEPT_HEADER });
  }*/

  public async update(
    value: T,
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): ODataResponse<void | ODataValueResponseV2<T>> {
    const convertedValue = this.converter.convertTo(value);
    const result = await this.client.put(this.getPath(), convertedValue, requestConfig, this.getDefaultHeaders());
    return convertV2ValueResponse(result, this.converter);
  }

  public delete(requestConfig?: ODataHttpClientConfig<ClientType>): ODataResponse<void> {
    return this.client.delete(this.getPath(), requestConfig);
  }

  protected addFullPath(path?: string) {
    return `${this.getPath() ?? ""}${path ? "/" + path : ""}`;
  }

  protected getDefaultHeaders() {
    return DEFAULT_HEADERS;
  }
}
