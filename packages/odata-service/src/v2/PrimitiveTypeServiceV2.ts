import { ValueConverter } from "@odata2ts/converter-api";
import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { ODataEntityModelResponseV2, ODataValueResponseV2 } from "@odata2ts/odata-core";
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
   * Requesting a <code>null</code> value results in 204 (No Content).
   * This makes the value undefined.
   *
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

  public updateValue(value: T) {
    const { client, path, getDefaultHeaders, name } = this.__base;
    const converter = this.__converter;

    return new UrlRequestCmd<ClientType, ODataValueResponseV2<T>, T>(client, ODataHttpMethods.Put, path, value, {
      headers: getDefaultHeaders(),
      mainRequestConverter: new ValueRequestConverter(converter, name!),
      mainResponseConverter: new ValueResponseConverterV2(converter),
    });
  }

  public deleteValue() {
    const { client, path } = this.__base;

    return new UrlRequestCmd<ClientType, void>(client, ODataHttpMethods.Delete, path, undefined);
  }
}
