import { QEnumCollectionPath, QFlagsEnumPath, QGuidPath, QueryObject } from "@odata2ts/odata-query-objects";
import { Amenities } from "./TesterModel.js";

export class QBook extends QueryObject {
  public readonly id = new QGuidPath(this.withPrefix("id"));
  public readonly amenities = new QFlagsEnumPath(this.withPrefix("amenities"), Amenities);
  public readonly otherAmenities = new QEnumCollectionPath(this.withPrefix("otherAmenities"), Amenities);
}

export const qBook = new QBook();
