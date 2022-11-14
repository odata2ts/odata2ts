import { QId, QStringParam } from "../../../src";

export type BookIdModel =
  | string
  | {
      isbn: string;
    };

export class BookIdFunction extends QId<BookIdModel> {
  private readonly params = [new QStringParam("isbn")];

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
