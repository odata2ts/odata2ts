import { booleanToNumberConverter } from "@odata2ts/test-converters";

import { QBooleanParam, QGuidParam, QGuidV2Param, QId, QStringParam } from "../../../src";

export type BookIdModel =
  | string
  | {
      isbn: string;
    };

export class BookIdFunction extends QId<BookIdModel> {
  private readonly params = [new QGuidParam("isbn")];

  public getParams() {
    return this.params;
  }
}

export class BookIdV2Function extends QId<BookIdModel> {
  private readonly params = [new QGuidV2Param("isbn")];

  public getParams() {
    return this.params;
  }
}

export type BookIdModelWithConversion =
  | number
  | {
      test: number;
    };

export class BookIdFunctionWithConversion extends QId<BookIdModelWithConversion> {
  private readonly params = [new QBooleanParam("Test", "test", booleanToNumberConverter)];

  public getParams() {
    return this.params;
  }
}

export type ComplexBookIdModel = {
  title: string;
  author: string;
};

export class ComplexBookIdFunction extends QId<ComplexBookIdModel> {
  private readonly params = [new QStringParam("title"), new QStringParam("author")];

  public getParams() {
    return this.params;
  }
}
