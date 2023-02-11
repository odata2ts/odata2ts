import {
  QBooleanPath,
  QCollectionPath,
  QDatePath,
  QDateTimeOffsetPath,
  QEntityCollectionPath,
  QEntityPath,
  QEnumCollection,
  QEnumPath,
  QGuidCollection,
  QGuidParam,
  QGuidPath,
  QId,
  QNumberParam,
  QNumberPath,
  QStringCollection,
  QStringPath,
  QTimeOfDayPath,
  QueryObject,
} from "../../src";
import { QParamModel } from "../../src/param/QParamModel";

export enum FeaturesEnum {
  Feature1 = "Feature1",
  Feature2 = "Feature2",
}

export interface SimpleEntity {
  id: number;
  name: string;
  feat: FeaturesEnum;
  complexton: ComplexEntity;
}

export type SimpleEntityId = number | Pick<SimpleEntity, "id">;

export interface ComplexEntity {
  ID: string; // GUID
  ID2: number;
  x?: number;
  y?: string;
  Z: boolean;
  az?: string; // DateString;
  bz?: string; // TimeOfDayString;
  cz: string; //DateTimeOffsetString;
  xy?: SimpleEntity;
  xx: Array<SimpleEntity>;
  primitiveCollection: Array<string>;
  nominalizedCollection?: Array<string>; // GuidString
  features: Array<FeaturesEnum>;
  favFeature: FeaturesEnum;
}

export type ComplexEntityId = Pick<ComplexEntity, "ID" | "ID2">;

export class QSimpleEntity extends QueryObject<SimpleEntity> {
  public readonly id = new QNumberPath(this.withPrefix("id"));
  public readonly name = new QStringPath(this.withPrefix("name"));
  public readonly feat = new QEnumPath(this.withPrefix("feat"));
  public readonly complexton = new QEntityPath(this.withPrefix("complexton"), () => QComplexEntity);
}

export class QSimpleEntityId extends QId<SimpleEntityId> {
  getParams(): Array<QParamModel<any, any>> {
    return [new QNumberParam("id")];
  }
}

export const qSimple = new QSimpleEntity();

export class QComplexEntity extends QueryObject<ComplexEntity> {
  public readonly id = new QGuidPath(this.withPrefix("id"));
  public readonly x = new QNumberPath(this.withPrefix("x"));
  public readonly y = new QStringPath(this.withPrefix("y"));
  public readonly z = new QBooleanPath(this.withPrefix("Z"));
  public readonly az = new QDatePath(this.withPrefix("az"));
  public readonly bz = new QTimeOfDayPath(this.withPrefix("bz"));
  public readonly cz = new QDateTimeOffsetPath(this.withPrefix("cz"));
  public readonly xy = new QEntityPath(this.withPrefix("xy"), () => QSimpleEntity);
  public readonly xx = new QEntityCollectionPath(this.withPrefix("xx"), () => QSimpleEntity);
  public readonly primitiveCollection = new QCollectionPath(
    this.withPrefix("PrimitiveCollection"),
    () => QStringCollection
  );
  public readonly nominalizedCollection = new QCollectionPath(
    this.withPrefix("NominalizedCollection"),
    () => QGuidCollection
  );
  public readonly features = new QCollectionPath("features", () => QEnumCollection);
  public readonly favFeature = new QEnumPath("favFeature");
}

export class QComplexEntityId extends QId<ComplexEntityId> {
  getParams(): Array<QParamModel<any, any>> {
    return [new QGuidParam("ID", "id"), new QNumberParam("  ID2", "idZwo")];
  }
}

export const qComplex = new QComplexEntity();
