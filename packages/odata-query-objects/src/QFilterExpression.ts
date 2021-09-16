export class QFilterExpression {
  constructor(private expression?: string) {}

  public toString(): string {
    return this.expression?.trim() || "";
  }

  public not(): QFilterExpression {
    if (this.expression?.trim()) {
      this.expression = `not(${this.expression})`;
    }
    return this;
  }

  public and(expression: QFilterExpression): QFilterExpression {
    const thisIsEmpty = !this.expression?.toString();
    const newIsEmpty = !expression?.toString();

    if (!thisIsEmpty && !newIsEmpty) {
      this.expression = `${this.expression} and ${expression.toString()}`;
    }
    if (thisIsEmpty) {
      this.expression = expression.toString();
    }
    return this;
  }

  public or(expression: QFilterExpression): QFilterExpression {
    const thisIsEmpty = !this.expression?.toString();
    const newIsEmpty = !expression?.toString();

    if (!thisIsEmpty && !newIsEmpty) {
      return new QFilterExpression(`(${this.expression} or ${expression.toString()})`);
    }
    if (thisIsEmpty) {
      this.expression = expression.toString();
    }
    return this;
  }
}
