import { PrefixModel, stringToPrefixModelConverter } from "@odata2ts/test-converters";

import { QEntityPath, QStringPath, QueryObject } from "../../../src";

export interface BookModel {
  title: string;
  author: AuthorModel;
}

export class QBook extends QueryObject<BookModel> {
  public readonly title = new QStringPath("title");
  public readonly author = new QEntityPath("AUTHOR", () => QAuthor);
}

export interface AuthorModel {
  name: PrefixModel;
}

export class QAuthor extends QueryObject<AuthorModel> {
  public readonly name = new QStringPath("name", stringToPrefixModelConverter);
}
