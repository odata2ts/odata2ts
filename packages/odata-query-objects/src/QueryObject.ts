export class QueryObject {
  constructor(private prefix?: string) {}

  protected withPrefix(path: string) {
    return this.prefix ? `${this.prefix}/${path}` : path;
  }
}
