export class QFilterExpression {
  private expression: string;

  constructor(expression: string) {
    if (!expression || !expression.trim()) {
      throw Error("Expression must be supplied!");
    }

    this.expression = expression;
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
