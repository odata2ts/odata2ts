import { QFunction, QStringParam } from "../../../src";

export type BookIdModel =
  | string
  | {
      isbn: string;
    };

export class BookIdFunction extends QFunction<BookIdModel> {
  constructor(path: string) {
    // Note: ids are handled the same for v2 & v4 => setting isV2 to true would be wrong
    super(path, "EntityXy");
  }

  private readonly params = [new QStringParam("isbn")];

  public getParams() {
    return this.params;
  }
}
