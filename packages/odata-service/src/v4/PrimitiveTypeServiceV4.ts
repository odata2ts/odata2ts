import { ValueConverter } from "@odata2ts/converter-api";
import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
import { ODataValueResponseFor, ODataVersionV4 } from "@odata2ts/odata-core";
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

export class PrimitiveTypeServiceV4<T, V extends ODataVersionV4 = "4.0"> {
  protected readonly __base: ServiceStateHelper<V>;
  protected readonly __converter: ValueConverter<any, T>;

  public constructor(
    client: ODataHttpClient,
    basePath: string,
    name: string,
    converter: ValueConverter<any, any> = getIdentityConverter(),
    options?: ODataServiceOptionsInternal<V>,
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

    return new UrlRequestCmd<ODataValueResponseFor<V, T> | undefined>(client, ODataHttpMethods.Get, path, undefined, {
      headers: getDefaultHeaders(),
      mainResponseConverter: new ValueResponseConverterV4(converter),
    });
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
    const { client, path, getDefaultHeaders, getVersionHeaders } = this.__base;
    const converter = this.__converter;

    return new UrlRequestCmd<ValueModificationResponseV4<Response, T, V>, T>(
      client,
      ODataHttpMethods.Put,
      path,
      value,
      {
        headers: { ...getDefaultHeaders(), ...getVersionHeaders() },
        mainRequestConverter: new ValueRequestConverter(converter),
        mainResponseConverter: new ValueResponseConverterV4<T>(converter) as MainResponseConverter<
          ValueModificationResponseV4<Response, T, V>,
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
    return new UrlRequestCmd<undefined>(client, ODataHttpMethods.Delete, path);
  }
}
