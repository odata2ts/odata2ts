export class QFilterExpression {
  constructor(private expression?: string) {}

  public toString(): string {
    return this.expression?.trim() || "";
  }

  public group(): QFilterExpression {
    if (this.expression?.trim()) {
      return new QFilterExpression(`(${this.expression})`);
    }
    return this;
  }

  public not(): QFilterExpression {
    if (this.expression?.trim()) {
      return new QFilterExpression(`not ${this.expression}`);
    }
    return this;
  }

  private combine(expression: QFilterExpression | null | undefined, isOrOperation: boolean) {
    if (expression?.toString()) {
      if (this.expression) {
        const newExpr = `${this.expression} ${isOrOperation ? "or" : "and"} ${expression.toString()}`;
        return new QFilterExpression(newExpr);
      } else {
        return expression;
      }
    }
    return this;
  }

  public and(expression: QFilterExpression | null | undefined): QFilterExpression {
    return this.combine(expression, false);
  }

  public or(expression: QFilterExpression | null | undefined): QFilterExpression {
    return this.combine(expression, true);
  }
}
