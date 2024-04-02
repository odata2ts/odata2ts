import { QBooleanParam, QBooleanPath, QId, QueryObject } from "@odata2ts/odata-query-objects";

// @ts-ignore
import { BookId, WithOwnStuffId } from "./TesterModel";

export class QBook extends QueryObject {
  public readonly id = new QBooleanPath(this.withPrefix("ID"));
  public readonly test = new QBooleanPath(this.withPrefix("test"));
}

export const qBook = new QBook();

export class QBookId extends QId<BookId> {
  private readonly params = [new QBooleanParam("ID", "id")];

  getParams() {
    return this.params;
  }
}

export class QNothingToAdd extends QBook {}

export const qNothingToAdd = new QNothingToAdd();

export class QWithOwnStuff extends QBook {
  public readonly id2 = new QBooleanPath(this.withPrefix("ID2"));
  public readonly test2 = new QBooleanPath(this.withPrefix("test2"));
}

export const qWithOwnStuff = new QWithOwnStuff();

export class QWithOwnStuffId extends QId<WithOwnStuffId> {
  private readonly params = [new QBooleanParam("ID", "id"), new QBooleanParam("ID2", "id2")];

  getParams() {
    return this.params;
  }
}
