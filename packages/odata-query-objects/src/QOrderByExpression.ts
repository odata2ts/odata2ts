export class QOrderByExpression {
  constructor(private expression: string) {
    if (!expression || !expression.trim()) {
      throw new Error("Expression must be supplied!");
    }
  }

  public toString(): string {
    return this.expression;
  }
}
