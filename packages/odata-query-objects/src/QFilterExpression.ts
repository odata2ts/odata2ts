/**
 * One decomposable comparison of a filter: a property path, an operator and the value asserted about it.
 *
 * The value is the OData-side one - after the property's converter, before URL rendering - so it is always
 * a JSON-serialisable primitive. That is what lets a cache key be hashed at all: a caller-side value may be
 * a `bigint`, which `JSON.stringify` refuses.
 */
export interface FilterClause {
  readonly path: string;
  readonly operator: string;
  readonly value: unknown;
}

export class QFilterExpression {
  /**
   * The string form and a structured description of the very same filter, kept side by side.
   *
   * `clauses` holds what could be decomposed into path/operator/value; `raw` holds every fragment that
   * could not - an `or`, a negation, a grouping, a string function, a lambda operator, a
   * property-to-property comparison. A filter is fully described by the two together, and a cache key
   * built from them converges with a differently written but equivalent query exactly as far as `clauses`
   * reaches.
   *
   * An expression constructed from a string alone is raw by default: whoever built it did not say what it
   * asserts, so nothing may be assumed about it.
   */
  constructor(
    private expression?: string,
    private clauses: ReadonlyArray<FilterClause> = [],
    private raw: ReadonlyArray<string> = expression?.trim() && !clauses.length ? [expression] : [],
  ) {}

  public toString(): string {
    return this.expression?.trim() || "";
  }

  public getClauses(): ReadonlyArray<FilterClause> {
    return this.clauses;
  }

  public getRaw(): ReadonlyArray<string> {
    return this.raw;
  }

  /**
   * Collapses this expression into a single raw fragment: the structure of what it asserts is gone the
   * moment it is grouped, negated or or-ed, since the map a cache key uses is an AND-map of independent
   * assertions.
   */
  private collapse(expression: string): QFilterExpression {
    return new QFilterExpression(expression, [], [expression]);
  }

  public group(): QFilterExpression {
    if (this.expression?.trim()) {
      return this.collapse(`(${this.expression})`);
    }
    return this;
  }

  public not(): QFilterExpression {
    if (this.expression?.trim()) {
      return this.collapse(`not ${this.expression}`);
    }
    return this;
  }

  private combine(expression: QFilterExpression | null | undefined, isOrOperation: boolean) {
    if (expression?.toString()) {
      if (this.expression) {
        const newExpr = `${this.expression} ${isOrOperation ? "or" : "and"} ${expression.toString()}`;
        // an `and` is what the structured map already means, so both sides survive it; an `or` is not
        // expressible in it at all and takes the whole expression down to raw
        return isOrOperation
          ? this.collapse(newExpr)
          : new QFilterExpression(
              newExpr,
              [...this.clauses, ...expression.getClauses()],
              [...this.raw, ...expression.getRaw()],
            );
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
