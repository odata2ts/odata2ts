import { HttpResponseModel } from "@odata2ts/http-client-api";
import { MainResponseConverter } from "@odata2ts/odata-query-objects";
import { ResponseConverter } from "./ResponseConverter";

/**
 * We don't have any typings for this.
 */
export type ResponseSourceType = any;

export class ResponseConverterChain<TargetType, FinalType = TargetType> {
  private prepends: Array<ResponseConverter<ResponseSourceType, ResponseSourceType>> = [];
  private appends: Array<ResponseConverter<any, any>> = [];

  public constructor(private mainConverter?: MainResponseConverter<TargetType, any>) {}

  public prependConverter(converter: ResponseConverter<ResponseSourceType, ResponseSourceType>) {
    this.prepends.push(converter);
    return this;
  }

  public appendConverter<NewType>(converter: ResponseConverter<FinalType, NewType>) {
    this.appends.push(converter);
    return this as unknown as ResponseConverterChain<TargetType, NewType>;
  }

  public convert(response: HttpResponseModel<ResponseSourceType>): HttpResponseModel<FinalType> {
    let result = response;
    result = this.prepends.reduce((res, conv) => conv(res), result);
    result = this.mainConverter ? this.mainConverter.convert(result) : result;
    result = this.appends.reduce((res, conv) => conv(res), result);

    return result;
  }
}
