import { ValueConverter } from "@odata2ts/converter-api";
import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { ODataValueResponseV2 } from "@odata2ts/odata-core";
import {
  FlexibleConversionModel,
  getIdentityConverter,
  QParamModel,
  ResponseValueConverterV2,
  ValueResponseConverterV2,
} from "@odata2ts/odata-query-objects";
import { ODataServiceOptions } from "../ODataServiceOptions";
import { UrlRequestCmd } from "../request";
import { ServiceStateHelper } from "../ServiceStateHelper.js";

interface RequestResponseConverter<T> extends ResponseValueConverterV2<T>, Pick<QParamModel<T, any>, "convertTo"> {}

class ValueRequestConverter<T> {
  constructor(
    private valueConverter: RequestResponseConverter<T>,
    private name: string,
  ) {}

  convertToOData(userModel: FlexibleConversionModel<T>): FlexibleConversionModel<any> {
    return {
      [this.name]: this.valueConverter.convertTo(userModel),
    };
  }
}

export class PrimitiveTypeServiceV2<in out ClientType extends ODataHttpClient, T> {
  protected readonly __base: ServiceStateHelper<ClientType>;
  protected readonly __converter: RequestResponseConverter<T>;

  public constructor(
    client: ClientType,
    basePath: string,
    name: string,
    { convertTo, convertFrom }: ValueConverter<any, T> = getIdentityConverter(),
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
   * Get the primitive value.
   * Spec: {@link https://www.odata.org/documentation/odata-version-2-0/operations/} - 2.2 Retrieving individual properties
   *
   * Always returns the response structure, the value might be `null`.
   */
  public getValue() {
    const { client, path, getDefaultHeaders } = this.__base;
    const converter = this.__converter;

    return new UrlRequestCmd<ClientType, ODataValueResponseV2<T>>(client, ODataHttpMethods.Get, path, undefined, {
      headers: getDefaultHeaders(),
      mainResponseConverter: new ValueResponseConverterV2(converter),
    });
  }

  /*public getRawValue(requestConfig?: ODataHttpClientConfig<ClientType>): ODataResponse<any> {
    return this.client.get(this.getPath() + RAW_VALUE_SUFFIX, requestConfig, { headers: OPEN_ACCEPT_HEADER });
  }*/

  /**
   * Update the value.
   * Spec: {@link https://www.odata.org/documentation/odata-version-2-0/operations/} - 2.6 Updating Entries
   *
   * The response is 204 with no data.
   *
   * @param value
   */
  public updateValue(value: T) {
    const { client, path, getDefaultHeaders, name } = this.__base;
    const converter = this.__converter;

    return new UrlRequestCmd<ClientType, undefined, T>(client, ODataHttpMethods.Put, path, value, {
      headers: getDefaultHeaders(),
      mainRequestConverter: new ValueRequestConverter(converter, name!),
    });
  }

  /**
   * Delete the value.
   *
   * Returns 204 with no data.
   */
  public deleteValue() {
    const { client, path } = this.__base;

    return new UrlRequestCmd<ClientType, undefined>(client, ODataHttpMethods.Delete, path, undefined);
  }
}
