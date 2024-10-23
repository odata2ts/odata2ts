import { QBooleanParam, QBooleanPath, QEntityPath, QEnumPath, QId, QueryObject } from "@odata2ts/odata-query-objects";
// @ts-ignore
import type { BOOK_KEY, PARENT_KEY } from "./TesterModel";
// @ts-ignore
import { CHOICE_MODEL } from "./TesterModel";

export class PARENT_BASE_TYPE_Q_OBJ extends QueryObject {
  public readonly PARENT_ID = new QBooleanPath(this.withPrefix("parentId"));
}

export class PARENT_Q_OBJ extends PARENT_BASE_TYPE_Q_OBJ {
  public get BOOK_Q_OBJ_ID() {
    return this.__asBOOK_Q_OBJ().ID;
  }

  public get BOOK_Q_OBJ_MY_CHOICE() {
    return this.__asBOOK_Q_OBJ().MY_CHOICE;
  }

  public get BOOK_Q_OBJ_ADDRESS() {
    return this.__asBOOK_Q_OBJ().ADDRESS;
  }

  private __asBOOK_Q_OBJ() {
    return new BOOK_Q_OBJ(this.withPrefix("Tester.Book"));
  }
}

export const pARENT_Q_OBJ = new PARENT_Q_OBJ();

export class PARENT_ID_Q_OBJ extends QId<PARENT_KEY> {
  private readonly params = [new QBooleanParam("parentId", "PARENT_ID")];

  getParams() {
    return this.params;
  }
}

export class BOOK_Q_OBJ extends PARENT_BASE_TYPE_Q_OBJ {
  public readonly ID = new QBooleanPath(this.withPrefix("id"));
  public readonly MY_CHOICE = new QEnumPath(this.withPrefix("my_Choice"), CHOICE_MODEL);
  public readonly ADDRESS = new QEntityPath(this.withPrefix("Address"), () => LOCATION_Q_OBJ);
}

export const bOOK_Q_OBJ = new BOOK_Q_OBJ();

export class BOOK_ID_Q_OBJ extends QId<BOOK_KEY> {
  private readonly params = [new QBooleanParam("parentId", "PARENT_ID"), new QBooleanParam("id", "ID")];

  getParams() {
    return this.params;
  }
}

export class LOCATION_Q_OBJ extends QueryObject {
  public readonly TEST = new QBooleanPath(this.withPrefix("TEST"));
}

export const lOCATION_Q_OBJ = new LOCATION_Q_OBJ();
