import { ValueConverter } from "@odata2ts/converter-api";
import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { ODataValueResponseV4 } from "@odata2ts/odata-core";
import {
  FlexibleConversionModel,
  getIdentityConverter,
  MainResponseConverter,
  ValueResponseConverterV4,
} from "@odata2ts/odata-query-objects";
import { ODataServiceOptionsInternal } from "../ODataServiceOptions";
import { UrlRequestCmd } from "../request";
import { ServiceStateHelper } from "../ServiceStateHelper.js";
import { ValueModificationResponseV4 } from "./ResponseTypeChoicesV4";

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
  protected readonly __converter: ValueConverter<any, T>;

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
   * Get the value.
   * Spec: {@link https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_RequestingIndividualProperties}
   *
   * Requesting a `null` value actually results in 204 (No Content), so `data: undefined` and not `data: { value: undefined }`.
   */
  public getValue() {
    const { client, path, getDefaultHeaders } = this.__base;
    const converter = this.__converter;

    return new UrlRequestCmd<ClientType, ODataValueResponseV4<T> | undefined>(
      client,
      ODataHttpMethods.Get,
      path,
      undefined,
      {
        headers: getDefaultHeaders(),
        mainResponseConverter: new ValueResponseConverterV4(converter),
      },
    );
  }

  /**
   * Update the value.
   * Spec: https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_UpdateaPrimitiveProperty
   *
   * The response of this operation is dependent on the `Prefer` header.
   * By default, you get 204 and no response data, while adding the prefer header with `Prefer: return=representation`
   * should yield status 200 with the proper and complete model.
   *
   * If you know in which way your server responds, you can easily supply this information via a boolean switch
   * to get the correct typing. `true` means that the complete entity is returned, while `false` (default) determines
   * that no data is returned, e.g. `updateValue<true>(...)`.
   *
   * @param value
   */
  public updateValue<Response extends boolean = false>(value: T) {
    const { client, path, getDefaultHeaders } = this.__base;
    const converter = this.__converter;

    return new UrlRequestCmd<ClientType, ValueModificationResponseV4<Response, T>, T>(
      client,
      ODataHttpMethods.Put,
      path,
      value,
      {
        headers: getDefaultHeaders(),
        mainRequestConverter: new ValueRequestConverter(converter),
        mainResponseConverter: new ValueResponseConverterV4<T>(converter) as MainResponseConverter<
          ValueModificationResponseV4<Response, T>,
          T
        >,
      },
    );
  }

  /**
   * Delete the value.
   * Spec: https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_UpdateaPrimitiveProperty
   *
   * The response should be 204 and no data.
   */
  public deleteValue() {
    const { client, path } = this.__base;
    return new UrlRequestCmd<ClientType, undefined>(client, ODataHttpMethods.Delete, path);
  }
}
