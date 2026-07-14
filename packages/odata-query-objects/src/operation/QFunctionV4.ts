import { ExtractDataTypeFromV4ResponseStructure, MainResponseConverter } from "../response/MainResponseConverter";
import { QFunction } from "./QFunction";

/**
 * Base class for handling an V4 OData function.
 *
 * This includes handling of entity id paths (same format as V4 functions).
 */
export abstract class QFunctionV4<ParamModel, ResponseStructure> extends QFunction<ParamModel, ResponseStructure> {
  public constructor(
    name: string,
    protected responseConverter?: MainResponseConverter<
      ResponseStructure,
      ExtractDataTypeFromV4ResponseStructure<ResponseStructure>
    >,
  ) {
    super(name);
  }

  public isV2(): boolean {
    return false;
  }

  public getResponseConverter() {
    return this.responseConverter;
  }
}
