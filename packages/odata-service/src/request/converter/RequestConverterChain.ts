import type { QParamModel, QueryObjectModel } from "@odata2ts/odata-query-objects";
import type { RequestInfo } from "../RequestInfo";
import type { MainRequestConverter, RequestConverter } from "./RequestConverter";

/**
 * We don't have any typings for this.
 */
export type RequestTargetType = any;

export class RequestConverterChain<SourceType> {
  private prepends: Array<RequestConverter<SourceType>> = [];
  private appends: Array<RequestConverter<RequestTargetType>> = [];

  public constructor(private mainConverter?: MainRequestConverter<SourceType, RequestTargetType>) {}

  private applyMainConverter<T, S = T>(request: RequestInfo<T>) {
    const converter = this.mainConverter;
    if (!converter) {
      return request;
    }

    const asQ = converter as QueryObjectModel<S, T>;
    const asQPM = converter as QParamModel<S, T>;

    // QueryObject are used for data transformations
    if (typeof asQ.convertToOData === "function") {
      return request.withData<S>(asQ.convertToOData(request.data));
    }
    // QParams as well
    else if (typeof asQPM.convertTo === "function") {
      return request.withData<S>(asQPM.convertTo(request.data) as S);
    }

    throw Error("Wrong conversion function signature for request converter!");
  }

  private applyConverters<T>(request: RequestInfo<T>, converters: Array<RequestConverter<T>>) {
    return converters.reduce((result, converter) => converter(result), request);
  }

  public prependConverter(converter: RequestConverter<SourceType>) {
    this.prepends.push(converter);
    return this;
  }

  public appendConverter(converter: RequestConverter<RequestTargetType>) {
    this.appends.push(converter);
    return this;
  }

  public convert(request: RequestInfo<SourceType>): RequestInfo<RequestTargetType> {
    let result = request;
    result = this.applyConverters(result, this.prepends);
    result = this.applyMainConverter(result);
    result = this.applyConverters(result, this.appends);

    return result;
  }
}
