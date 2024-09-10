import { QBooleanPath, QNumericEnumCollectionPath, QNumericEnumPath, QueryObject } from "@odata2ts/odata-query-objects";
// @ts-ignore
import { Choice } from "./TesterModel";

export class QBook extends QueryObject {
  public readonly id = new QBooleanPath(this.withPrefix("id"));
  public readonly myChoice = new QNumericEnumPath(this.withPrefix("myChoice"), Choice);
  public readonly otherChoices = new QNumericEnumCollectionPath(this.withPrefix("otherChoices"), Choice);
}

export const qBook = new QBook();
