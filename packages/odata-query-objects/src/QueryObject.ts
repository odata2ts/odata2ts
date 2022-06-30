export class QueryObject {
  constructor(private _prefix?: string) {}

  protected withPrefix(path: string) {
    return this._prefix ? `${this._prefix}/${path}` : path;
  }
}
