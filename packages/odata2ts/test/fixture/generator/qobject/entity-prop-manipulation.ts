import {
  QBooleanParam,
  QBooleanPath,
  QEntityPath,
  QId,
  QNumberParam,
  QNumberPath,
  QueryObject,
} from "@odata2ts/odata-query-objects";

// @ts-ignore
import { BookId, CategoryId } from "./TesterModel";

export class QCategory extends QueryObject {
  public readonly id = new QBooleanPath(this.withPrefix("ID"));
  public readonly version = new QNumberPath(this.withPrefix("version"));
}

export const qCategory = new QCategory();

export class QCategoryId extends QId<CategoryId> {
  private readonly params = [new QBooleanParam("ID", "id"), new QNumberParam("version")];

  getParams() {
    return this.params;
  }
}

export class QBook extends QueryObject {
  public readonly id = new QBooleanPath(this.withPrefix("ID"));
  public readonly address = new QEntityPath(this.withPrefix("address"), () => QLOCATION);
}

export const qBook = new QBook();

export class QBookId extends QId<BookId> {
  private readonly params = [new QBooleanParam("ID", "id")];

  getParams() {
    return this.params;
  }
}

export class QLOCATION extends QueryObject {
  public readonly TEST = new QBooleanPath(this.withPrefix("TEST"));
}

export const qLOCATION = new QLOCATION();
