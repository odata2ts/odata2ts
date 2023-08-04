import { ValueConverter } from "@odata2ts/converter-api";
import { ODataHttpClient, ODataHttpClientConfig, ODataResponse } from "@odata2ts/http-client-api";
import { ODataValueResponseV4 } from "@odata2ts/odata-core";
import { convertV4ValueResponse } from "@odata2ts/odata-query-objects";
import { getIdentityConverter } from "@odata2ts/odata-query-objects/lib/IdentityConverter";

import { ServiceStateHelper } from "../ServiceStateHelper";

// const RAW_VALUE_SUFFIX = "/$value";

export class PrimitiveTypeServiceV4<ClientType extends ODataHttpClient, T> {
  protected readonly __base: ServiceStateHelper<T>;
  protected readonly __converter: ValueConverter<any, any>;

  public constructor(
    client: ODataHttpClient,
    basePath: string,
    name: string,
    converter: ValueConverter<any, any> = getIdentityConverter(),
    bigNumbersAsString: boolean = false
  ) {
    this.__base = new ServiceStateHelper<T>(client, basePath, name, bigNumbersAsString);
    this.__converter = converter;
  }

  public getPath() {
    return this.__base.path;
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
    const { client, path, getDefaultHeaders } = this.__base;

    const result = await client.get(path, requestConfig, getDefaultHeaders());
    return convertV4ValueResponse(result, this.__converter);
  }

  /*public async getRawValue(requestConfig?: ODataClientConfig<ClientType>): ODataResponse<any> {
    const { client, qModel, path } = this.__base;

    return client.get(path + RAW_VALUE_SUFFIX, requestConfig);
  }*/

  public async updateValue(
    value: T,
    requestConfig?: ODataHttpClientConfig<ClientType>
  ): ODataResponse<void | ODataValueResponseV4<T>> {
    const { client, path, getDefaultHeaders } = this.__base;

    const requestBody = { value: this.__converter.convertTo(value) };
    const result = await client.put(path, requestBody, requestConfig, getDefaultHeaders());
    return convertV4ValueResponse(result, this.__converter);
  }

  public deleteValue(requestConfig?: ODataHttpClientConfig<ClientType>): ODataResponse<void> {
    const { client, path } = this.__base;
    return client.delete(path, requestConfig);
  }
}
