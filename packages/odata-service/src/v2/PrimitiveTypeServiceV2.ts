import { ValueConverter } from "@odata2ts/converter-api";
import { ODataHttpClient, ODataHttpClientConfig, ODataResponse } from "@odata2ts/http-client-api";
import { ODataValueResponseV2 } from "@odata2ts/odata-core";
import { ConvertibleV2, convertV2ValueResponse } from "@odata2ts/odata-query-objects";
import { getIdentityConverter } from "@odata2ts/odata-query-objects/lib/IdentityConverter";
import { ODataServiceOptions } from "../ODataService";
import { ServiceStateHelper } from "../ServiceStateHelper.js";

// const RAW_VALUE_SUFFIX = "/$value";
//
// const OPEN_ACCEPT_HEADER = { accept: "*/*" };
// const DEFAULT_STREAM_MIME_TYPE = "application/octet-stream";

export class PrimitiveTypeServiceV2<in out ClientType extends ODataHttpClient, T> {
  protected readonly __base: ServiceStateHelper<ClientType>;
  protected readonly __converter: ConvertibleV2;

  public constructor(
    client: ClientType,
    basePath: string,
    name: string,
    { convertTo, convertFrom }: ValueConverter<any, any> = getIdentityConverter(),
    mappedName?: string,
    options?: ODataServiceOptions,
  ) {
    this.__base = new ServiceStateHelper(client, basePath, name, options);
    this.__converter = {
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
    return this.__base.path;
  }

  /**
   * Requesting a <code>null</code> value results in 204 (No Content).
   * This makes the value undefined.
   *
   * @param requestConfig
   */
  public async getValue(
    requestConfig?: ODataHttpClientConfig<ClientType>,
  ): ODataResponse<void | ODataValueResponseV2<T>> {
    const { client, path, getDefaultHeaders } = this.__base;

    const result = await client.get(path, requestConfig, getDefaultHeaders());
    return convertV2ValueResponse(result, this.__converter);
  }

  /*public async getRawValue(requestConfig?: ODataHttpClientConfig<ClientType>): ODataResponse<any> {
    return this.client.get(this.getPath() + RAW_VALUE_SUFFIX, requestConfig, { headers: OPEN_ACCEPT_HEADER });
  }*/

  public async updateValue(
    value: T,
    requestConfig?: ODataHttpClientConfig<ClientType>,
  ): ODataResponse<void | ODataValueResponseV2<T>> {
    const { client, path, getDefaultHeaders, name } = this.__base;

    const requestBody = { [name!]: this.__converter.convertTo(value) };
    const result = await client.put(path, requestBody, requestConfig, getDefaultHeaders());
    return convertV2ValueResponse(result, this.__converter);
  }

  public deleteValue(requestConfig?: ODataHttpClientConfig<ClientType>): ODataResponse<void> {
    const { client, path } = this.__base;
    return client.delete(path, requestConfig);
  }
}
