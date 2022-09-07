import { QBooleanParam, QBooleanPath, QFunction, QueryObject } from "@odata2ts/odata-query-objects";

// @ts-ignore
import { ChildId, GrandParentId, ParentId } from "./TesterModel";

export class QGrandParent extends QueryObject {
  public readonly id = new QBooleanPath(this.withPrefix("id"));
}

export const qGrandParent = new QGrandParent();

export class QGrandParentId extends QFunction<GrandParentId> {
  private readonly params = [new QBooleanParam("id")];

  constructor(path: string) {
    super(path, "", true);
  }

  getParams() {
    return this.params;
  }
}

export class QParent extends QueryObject {
  public readonly id = new QBooleanPath(this.withPrefix("id"));
  public readonly parentalAdvice = new QBooleanPath(this.withPrefix("parentalAdvice"));
}

export const qParent = new QParent();

export class QParentId extends QFunction<ParentId> {
  private readonly params = [new QBooleanParam("id")];

  constructor(path: string) {
    super(path, "", true);
  }

  getParams() {
    return this.params;
  }
}

export class QChild extends QueryObject {
  public readonly id = new QBooleanPath(this.withPrefix("id"));
  public readonly parentalAdvice = new QBooleanPath(this.withPrefix("parentalAdvice"));
  public readonly ch1ld1shF4n = new QBooleanPath(this.withPrefix("Ch1ld1shF4n"));
}

export const qChild = new QChild();

export class QChildId extends QFunction<ChildId> {
  private readonly params = [new QBooleanParam("id")];

  constructor(path: string) {
    super(path, "", true);
  }

  getParams() {
    return this.params;
  }
}
