export class QFilterExpression {
  constructor(private expression: string) {
    if (!expression || !expression.trim()) {
      throw Error("Expression must be supplied!");
    }
  }

  public toString(): string {
    return this.expression;
  }

  public not(): QFilterExpression {
    return new QFilterExpression(`not(${this.expression})`);
  }

  public and(expression: QFilterExpression): QFilterExpression {
    return new QFilterExpression(`${this.expression} and ${expression}`);
  }

  public or(expression: QFilterExpression): QFilterExpression {
    return new QFilterExpression(`(${this.expression} or ${expression})`);
  }
}
