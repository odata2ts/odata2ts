import { QueryObject, QGuidPath, QBooleanPath } from "@odata2ts/odata-query-objects";

export class QGrandParent extends QueryObject {
  public readonly id = new QGuidPath(this.withPrefix("id"));

  constructor(path?: string) {
    super(path);
  }
}

export const qGrandParent = new QGrandParent();

export class QParent extends QueryObject {
  public readonly id = new QGuidPath(this.withPrefix("id"));
  public readonly parentalAdvice = new QBooleanPath(this.withPrefix("parentalAdvice"));

  constructor(path?: string) {
    super(path);
  }
}

export const qParent = new QParent();

export class QChild extends QueryObject {
  public readonly id = new QGuidPath(this.withPrefix("id"));
  public readonly parentalAdvice = new QBooleanPath(this.withPrefix("parentalAdvice"));
  public readonly ch1ld1shF4n = new QBooleanPath(this.withPrefix("Ch1ld1shF4n"));

  constructor(path?: string) {
    super(path);
  }
}

export const qChild = new QChild();
