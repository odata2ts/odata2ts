import { ValueConverter } from "@odata2ts/converter-api";
import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { ODataValueResponseV4 } from "@odata2ts/odata-core";
import { getIdentityConverter, ValueResponseConverterV4 } from "@odata2ts/odata-query-objects";
import { FlexibleConversionModel } from "@odata2ts/odata-query-objects/src/QueryObjectModel";
import { ODataServiceOptionsInternal } from "../ODataServiceOptions";
import { UrlRequestCmd } from "../request";
import { ServiceStateHelper } from "../ServiceStateHelper.js";

class ValueRequestConverter<T> {
  constructor(private valueConverter: ValueConverter<any, any>) {}

  convertToOData(userModel: FlexibleConversionModel<T>): FlexibleConversionModel<any> {
    return {
      value: this.valueConverter.convertTo(userModel),
    };
  }
}

export class PrimitiveTypeServiceV4<out ClientType extends ODataHttpClient, T> {
  protected readonly __base: ServiceStateHelper<ClientType>;
  protected readonly __converter: ValueConverter<any, any>;

  public constructor(
    client: ClientType,
    basePath: string,
    name: string,
    converter: ValueConverter<any, any> = getIdentityConverter(),
    options?: ODataServiceOptionsInternal,
  ) {
    this.__base = new ServiceStateHelper(client, basePath, name, options);
    this.__converter = converter;
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

    return new UrlRequestCmd<ClientType, ODataValueResponseV4<T> | void>(
      client,
      ODataHttpMethods.Get,
      path,
      undefined,
      {
        headers: getDefaultHeaders(),
        mainRequestConverter: converter,
        mainResponseConverter: new ValueResponseConverterV4(converter),
      },
    );
  }

  public updateValue(value: T) {
    const { client, path, getDefaultHeaders } = this.__base;
    const converter = this.__converter;

    return new UrlRequestCmd<ClientType, ODataValueResponseV4<T> | void, T>(client, ODataHttpMethods.Put, path, value, {
      headers: getDefaultHeaders(),
      mainRequestConverter: new ValueRequestConverter<T>(converter),
      mainResponseConverter: new ValueResponseConverterV4(converter),
    });
  }

  public deleteValue() {
    const { client, path } = this.__base;
    return new UrlRequestCmd<ClientType, ODataValueResponseV4<T | void>>(client, ODataHttpMethods.Delete, path);
  }
}
