import { QBooleanParam, QBooleanPath, QEntityPath, QEnumPath, QId, QueryObject } from "@odata2ts/odata-query-objects";
// @ts-ignore
import type { BookId, parentId } from "./TesterModel";
// @ts-ignore
import { Choice } from "./TesterModel";

export class parentBaseType extends QueryObject {
  public readonly parentId = new QBooleanPath(this.withPrefix("parentId"));
}

export class Qparent extends parentBaseType {
  public get QBook_id() {
    return this.__asQBook().id;
  }

  public get QBook_my_Choice() {
    return this.__asQBook().my_Choice;
  }

  public get QBook_Address() {
    return this.__asQBook().Address;
  }

  private __asQBook() {
    return new QBook(this.withPrefix("Tester.Book"));
  }
}

export const qparent = new Qparent();

export class QparentId extends QId<parentId> {
  private readonly params = [new QBooleanParam("parentId")];

  getParams() {
    return this.params;
  }
}

export class QBook extends parentBaseType {
  public readonly id = new QBooleanPath(this.withPrefix("id"));
  public readonly my_Choice = new QEnumPath(this.withPrefix("my_Choice"), Choice);
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
