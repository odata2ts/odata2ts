export class QFilterExpression {
  constructor(private expression?: string) {}

  public toString(): string {
    return this.expression?.trim() || "";
  }

  public not(): QFilterExpression {
    if (this.expression?.trim()) {
      return new QFilterExpression(`not(${this.expression})`);
    }
    return this;
  }

  private combine(
    expression: QFilterExpression | null | undefined,
    isOrOperation: boolean,
    withoutParentheses = false,
  ) {
    if (expression?.toString()) {
      if (this.expression) {
        const newExpr = `${this.expression} ${isOrOperation ? "or" : "and"} ${expression.toString()}`;
        return new QFilterExpression(isOrOperation && !withoutParentheses ? `(${newExpr})` : newExpr);
      } else {
        return expression;
      }
    }
    return this;
  }

  public and(expression: QFilterExpression | null | undefined): QFilterExpression {
    return this.combine(expression, false);
  }

  public or(expression: QFilterExpression | null | undefined, withoutParentheses = false): QFilterExpression {
    return this.combine(expression, true, withoutParentheses);
  }
}
