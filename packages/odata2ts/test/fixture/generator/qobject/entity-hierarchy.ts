import { QBooleanParam, QBooleanPath, QId, QueryObject } from "@odata2ts/odata-query-objects";

// @ts-ignore
import { ChildId, GrandParentId } from "./TesterModel";

export class QGrandParent extends QueryObject {
  public readonly id = new QBooleanPath(this.withPrefix("id"));
}

export const qGrandParent = new QGrandParent();

export class QGrandParentId extends QId<GrandParentId> {
  private readonly params = [new QBooleanParam("id")];

  getParams() {
    return this.params;
  }
}

export class QParent extends QGrandParent {
  public readonly parentalAdvice = new QBooleanPath(this.withPrefix("parentalAdvice"));
}

export const qParent = new QParent();

export class QChild extends QParent {
  public readonly id2 = new QBooleanPath(this.withPrefix("id2"));
  public readonly ch1ld1shF4n = new QBooleanPath(this.withPrefix("Ch1ld1shF4n"));
}

export const qChild = new QChild();

export class QChildId extends QId<ChildId> {
  private readonly params = [new QBooleanParam("id"), new QBooleanParam("id2")];

  getParams() {
    return this.params;
  }
}
