import { QBooleanParam, QBooleanPath, QId, QueryObject } from "@odata2ts/odata-query-objects";
// @ts-ignore
import type { ChildId, GrandParentId } from "./TesterModel";

export class QGrandParentBaseType extends QueryObject {
  public readonly id = new QBooleanPath(this.withPrefix("id"));
}

export class QGrandParent extends QGrandParentBaseType {
  public get QParent_parentalAdvice() {
    return this.__asQParent().parentalAdvice;
  }

  public get QChild_id2() {
    return this.__asQChild().id2;
  }

  public get QChild_ch1ld1shF4n() {
    return this.__asQChild().ch1ld1shF4n;
  }

  private __asQParent() {
    return new QParent(this.withPrefix("Tester.Parent"));
  }

  private __asQChild() {
    return new QChild(this.withPrefix("Tester.Child"));
  }
}

export const qGrandParent = new QGrandParent();

export class QGrandParentId extends QId<GrandParentId> {
  private readonly params = [new QBooleanParam("id")];

  getParams() {
    return this.params;
  }
}

export class QParentBaseType extends QGrandParentBaseType {
  public readonly parentalAdvice = new QBooleanPath(this.withPrefix("parentalAdvice"));
}

export class QParent extends QParentBaseType {
  public get QChild_id2() {
    return this.__asQChild().id2;
  }

  public get QChild_ch1ld1shF4n() {
    return this.__asQChild().ch1ld1shF4n;
  }

  private __asQChild() {
    return new QChild(this.withPrefix("Tester.Child"));
  }
}

export const qParent = new QParent();

export class QChild extends QParentBaseType {
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
