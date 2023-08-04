import { ValueConverter } from "@odata2ts/converter-api";
import { ODataHttpClient, ODataHttpClientConfig, ODataResponse } from "@odata2ts/http-client-api";
import { ODataValueResponseV4 } from "@odata2ts/odata-core";
import { convertV4ValueResponse } from "@odata2ts/odata-query-objects";
import { getIdentityConverter } from "@odata2ts/odata-query-objects/lib/IdentityConverter";

import { BIG_NUMBERS_HEADERS, DEFAULT_HEADERS } from "../RequestHeaders";

const RAW_VALUE_SUFFIX = "/$value";

export class PrimitiveTypeServiceV4<ClientType extends ODataHttpClient, T> {
  public constructor(
    private readonly client: ODataHttpClient,
    private readonly basePath: string,
    private readonly name: string,
    private readonly converter: ValueConverter<any, any> = getIdentityConverter(),
    private bigNumbersAsString: boolean = false
  ) {}

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
  ): ODataResponse<void | ODataValueResponseV4<T>> {
    const result = await this.client.get(this.getPath(), requestConfig);
    return convertV4ValueResponse(result, this.converter);
  }

  /*public async getRawValue(requestConfig?: ODataClientConfig<ClientType>): ODataResponse<any> {
    return this.client.get(this.getPath() + RAW_VALUE_SUFFIX, requestConfig);
  }*/

  public async update(
    value: T,
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): ODataResponse<void | ODataValueResponseV4<T>> {
    const convertedValue = this.converter.convertTo(value);
    const result = await this.client.put(this.getPath(), convertedValue, requestConfig);
    return convertV4ValueResponse(result, this.converter);
  }

  public delete(requestConfig?: ODataHttpClientConfig<ClientType>): ODataResponse<void> {
    return this.client.delete(this.getPath(), requestConfig);
  }

  protected addFullPath(path?: string) {
    return `${this.getPath() ?? ""}${path ? "/" + path : ""}`;
  }

  protected getDefaultHeaders() {
    return this.bigNumbersAsString ? BIG_NUMBERS_HEADERS : DEFAULT_HEADERS;
  }
}
