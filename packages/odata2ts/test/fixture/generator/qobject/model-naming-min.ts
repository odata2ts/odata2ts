import { QBooleanParam, QBooleanPath, QEntityPath, QEnumPath, QId, QueryObject } from "@odata2ts/odata-query-objects";

// @ts-ignore
import { BookId, parentId } from "./TesterModel";

export class Qparent extends QueryObject {
  public readonly parentId = new QBooleanPath(this.withPrefix("parentId"));
}

export const qparent = new Qparent();

export class QparentId extends QId<parentId> {
  private readonly params = [new QBooleanParam("parentId")];

  getParams() {
    return this.params;
  }
}

export class QBook extends Qparent {
  public readonly id = new QBooleanPath(this.withPrefix("id"));
  public readonly my_Choice = new QEnumPath(this.withPrefix("my_Choice"));
  public readonly Address = new QEntityPath(this.withPrefix("Address"), () => QLOCATION);
}

export const qBook = new QBook();

export class QBookId extends QId<BookId> {
  private readonly params = [new QBooleanParam("parentId"), new QBooleanParam("id")];

  getParams() {
    return this.params;
  }
}

export class QLOCATION extends QueryObject {
  public readonly TEST = new QBooleanPath(this.withPrefix("TEST"));
}

export const qLOCATION = new QLOCATION();
