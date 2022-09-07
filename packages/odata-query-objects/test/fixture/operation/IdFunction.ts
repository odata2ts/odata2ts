import { QFunction, QStringParam } from "../../../src";

export type BookIdModel =
  | string
  | {
      isbn: string;
    };

export class BookIdFunction extends QFunction<BookIdModel> {
  constructor(path: string) {
    // Note: the name of the entity must be supplied as part of the path, because it depends on EntitySet and NavigationProps
    // Note: ids are handled the same for v2 & v4 => setting isV2 to true would be wrong
    super(path, "");
  }

  private readonly params = [new QStringParam("isbn")];

  public getParams() {
    return this.params;
  }
}
