import { HttpResponseModel, ODataHttpClient, ODataHttpClientConfig, ODataHttpMethods } from "@odata2ts/http-client-api";
import { MainResponseConverter } from "@odata2ts/odata-query-objects";
import { MainRequestConverter, RequestConverter } from "./converter/RequestConverter";
import { RequestConverterChain } from "./converter/RequestConverterChain";
import { ResponseConverter } from "./converter/ResponseConverter";
import { ResponseConverterChain } from "./converter/ResponseConverterChain";
import { RequestInfo } from "./RequestInfo";

export interface RequestCmdOptions<ResponseStructure, DataStructure> {
  /**
   * Set headers for the request.
   */
  headers?: Record<string, string>;
  /**
   * Sets the main request converter which converts from the user facing model
   * to the OData facing model.
   */
  mainRequestConverter?: MainRequestConverter<DataStructure>;
  /**
   * Sets the main response converter which converts from the OData facing model
   * to the user facing model.
   */
  mainResponseConverter?: MainResponseConverter<ResponseStructure, any>;
}

/**
 * Encapsulates an HTTP request to the OData server. Follows the Command Pattern.
 */
export abstract class RequestCmd<
  ClientType extends ODataHttpClient,
  ResponseStructure,
  DataStructure = undefined,
  FinalResponseStructure = ResponseStructure,
> {
  private requestConverter: RequestConverterChain<DataStructure>;
  private responseConverter: ResponseConverterChain<ResponseStructure, FinalResponseStructure>;

  public constructor(
    protected client: ClientType,
    protected method: ODataHttpMethods,
    protected data?: DataStructure,
    protected options: RequestCmdOptions<ResponseStructure, DataStructure> = {},
  ) {
    const { mainRequestConverter, mainResponseConverter } = options;

    this.requestConverter = new RequestConverterChain(mainRequestConverter);
    this.responseConverter = new ResponseConverterChain(mainResponseConverter);
  }

  /**
   * The unchanging URL of this command object.
   */
  public abstract getUrl(): string;

  /**
   * Get information about the request.
   * The data (if any) is presented with user facing typings.
   */
  public getInfo(): RequestInfo<DataStructure> {
    const { headers } = this.options;

    return new RequestInfo<DataStructure>(this.method, this.getUrl(), headers, this.data);
  }

  /**
   * Get base information about the request.
   * All request converters get applied.
   *
   * With regard to data (if any), it gets converted from the user facing model
   * to the OData facing model, for which we don't have any typings, so we use <code>any</code>.
   *
   */
  public getInfoConverted() {
    const request = this.getInfo();
    const converter = this.requestConverter;

    // no converters => no conversion
    if (!converter) {
      return request;
    }

    return converter.convert(request);
  }

  /**
   * Add a new request converter at the beginning of the converter chain.
   * This converter can then handle the user facing data structures.
   *
   * @param converter
   * @returns itself in builder fashion
   */
  public prependRequestConverter(converter: RequestConverter<DataStructure>) {
    this.requestConverter.prependConverter(converter);

    return this;
  }

  /**
   * Add a new request converter at the end of the converter chain.
   * This converter can then handle the OData facing data structures.
   * Since we don't have any typings for this we use <code>any</code>.
   *
   * @param converter
   * @returns itself in builder fashion
   */
  public appendRequestConverter(converter: RequestConverter<any>) {
    this.requestConverter.appendConverter(converter);

    return this;
  }

  /**
   * Add a response converter to the beginning of the converter chain.
   * This converter can then handle the data structures as they are returned from OData.
   * Since we don't have any typings for this we use <code>any</code>.
   *
   * @param converter
   * @returns itself in builder fashion
   */
  public prependResponseConverter(converter: ResponseConverter<any, any>) {
    this.responseConverter.prependConverter(converter);

    return this;
  }

  /**
   * Add a response converter to the end of the converter chain.
   * This converter can then handle the data structures as they are returned for the user,
   * so with mapped property names and converted types.
   *
   * As the appended converter changes the final response structure, it is essential that
   * you follow the builder pattern to maintain the correct typings.
   *
   * @param converter
   * @returns itself in builder fashion
   */
  public appendResponseConverter<NewRespStructure>(
    converter: ResponseConverter<FinalResponseStructure, NewRespStructure>,
  ) {
    this.responseConverter.appendConverter<NewRespStructure>(converter);

    return this as unknown as RequestCmd<ClientType, ResponseStructure, DataStructure, NewRespStructure>;
  }

  /**
   * Main method of this command object: Executes the request.
   *
   * @param requestConfig optional configuration
   */
  public async execute(requestConfig?: ODataHttpClientConfig<ClientType>) {
    // apply request converters
    const request = this.getInfoConverted();

    // execute the request
    const response = await this.client.request<any>(
      request.url,
      request.method,
      request.data,
      requestConfig,
      request.headers,
    );

    // apply response converters
    return this.convertResponse(response);
  }

  private convertResponse(response: HttpResponseModel<any>) {
    const converter = this.responseConverter;
    if (!converter) {
      return response as HttpResponseModel<FinalResponseStructure>;
    }

    return converter.convert(response);
  }
}
