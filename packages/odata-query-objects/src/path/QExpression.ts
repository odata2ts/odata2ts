export class QExpression {
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

  public not(): QExpression {
    return new QExpression(`not(${this.expression})`);
  }

  public and(expression: QExpression): QExpression {
    return new QExpression(`${this.expression} and ${expression}`);
  }

  public or(expression: QExpression): QExpression {
    return new QExpression(`(${this.expression} or ${expression})`);
  }
}
