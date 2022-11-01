import { QBooleanParam, QBooleanPath, QEntityPath, QEnumPath, QId, QueryObject } from "@odata2ts/odata-query-objects";

// @ts-ignore
import { BOOK_KEY, PARENT_KEY } from "./TesterModel";

export class PARENT_Q_OBJ extends QueryObject {
  public readonly parentId = new QBooleanPath(this.withPrefix("parentId"));
}

export const pARENT_Q_OBJ = new PARENT_Q_OBJ();

export class PARENT_ID_Q_OBJ extends QId<PARENT_KEY> {
  private readonly params = [new QBooleanParam("parentId", "PARENT_ID")];

  getParams() {
    return this.params;
  }
}

export class BOOK_Q_OBJ extends PARENT_Q_OBJ {
  public readonly id = new QBooleanPath(this.withPrefix("id"));
  public readonly myChoice = new QEnumPath(this.withPrefix("my_Choice"));
  public readonly address = new QEntityPath(this.withPrefix("Address"), () => LOCATION_Q_OBJ);
}

export const bOOK_Q_OBJ = new BOOK_Q_OBJ();

export class BOOK_ID_Q_OBJ extends QId<BOOK_KEY> {
  private readonly params = [new QBooleanParam("parentId", "PARENT_ID"), new QBooleanParam("id", "ID")];

  getParams() {
    return this.params;
  }
}

export class LOCATION_Q_OBJ extends QueryObject {
  public readonly test = new QBooleanPath(this.withPrefix("TEST"));
}

export const lOCATION_Q_OBJ = new LOCATION_Q_OBJ();
