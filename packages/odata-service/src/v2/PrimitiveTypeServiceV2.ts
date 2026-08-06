import { ConverterOptions, ValueConverter } from "@odata2ts/converter-api";
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

export class PrimitiveTypeServiceV2<T> {
  protected readonly __base: ServiceStateHelper;
  protected readonly __converter: RequestResponseConverter<T>;

  public constructor(
    client: ODataHttpClient,
    basePath: string,
    name: string,
    converter: ValueConverter<any, T> = getIdentityConverter(),
    mappedName?: string,
    options?: ODataServiceOptions,
  ) {
    this.__base = new ServiceStateHelper(client, basePath, name, options);
    /*
     * The two conversion methods are delegated to rather than pulled off the converter, because a
     * converter may be a class with instance state: destructuring `{ convertFrom, convertTo }` strips
     * `this`, and `ChainedConverter` - which is what a configuration with more than one converter
     * produces - then throws on its own `this.converter2`. PrimitiveTypeServiceV4 keeps the object as
     * it is for the same reason.
     */
    this.__converter = {
      convertFrom: (value, converterOptions?: ConverterOptions) => converter.convertFrom(value, converterOptions),
      convertTo: (value, converterOptions?: ConverterOptions) => converter.convertTo(value, converterOptions),
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

    return new UrlRequestCmd<ODataValueResponseV2<T>>(client, ODataHttpMethods.Get, path, undefined, {
      headers: getDefaultHeaders(),
      mainResponseConverter: new ValueResponseConverterV2(converter),
    });
  }

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

    return new UrlRequestCmd<undefined, T>(client, ODataHttpMethods.Put, path, value, {
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

    return new UrlRequestCmd<undefined>(client, ODataHttpMethods.Delete, path, undefined);
  }
}
