import { QStringParam } from "../../../src";
import { QId } from "../../../src/operation/QId";

export type BookIdModel =
  | string
  | {
      isbn: string;
    };

export class BookIdFunction extends QId<BookIdModel> {
  private readonly params = [new QStringParam("isbn")];

  public getParams() {
    return this.params;
  }
}
