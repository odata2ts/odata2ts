export class QOrderByExpression {
  constructor(private expression: string) {
    if (!expression || !expression.trim()) {
      throw Error("Expression must be supplied!");
    }
  }

  public toString(): string {
    return this.expression;
  }
}
