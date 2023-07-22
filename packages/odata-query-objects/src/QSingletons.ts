import { ValueConverter } from "@odata2ts/converter-api";

import { QBinaryPath } from "./path/QBinaryPath";
import { QBooleanPath } from "./path/QBooleanPath";
import { QEnumPath } from "./path/QEnumPath";
import { QValuePathModel } from "./path/QPathModel";
import { QDateTimeOffsetV2Path } from "./path/v2/QDateTimeOffsetV2Path";
import { QDateTimeV2Path } from "./path/v2/QDateTimeV2Path";
import { QGuidV2Path } from "./path/v2/QGuidV2Path";
import { QNumberV2Path } from "./path/v2/QNumberV2Path";
import { QStringNumberV2Path } from "./path/v2/QStringNumberV2Path";
import { QStringV2Path } from "./path/v2/QStringV2Path";
import { QTimeV2Path } from "./path/v2/QTimeV2Path";
import { QBigNumberPath } from "./path/v4/QBigNumberPath";
import { QDatePath } from "./path/v4/QDatePath";
import { QDateTimeOffsetPath } from "./path/v4/QDateTimeOffsetPath";
import { QGuidPath } from "./path/v4/QGuidPath";
import { QNumberPath } from "./path/v4/QNumberPath";
import { QStringPath } from "./path/v4/QStringPath";
import { QTimeOfDayPath } from "./path/v4/QTimeOfDayPath";
import { QueryObject } from "./QueryObject";

const ATTRIBUTE_NAME = "it";
const PRIMITIVE_VALUE_REFERENCE = "$it";

export interface PrimitiveCollectionType<T> {
  [ATTRIBUTE_NAME]: T;
}

export type StringCollection = PrimitiveCollectionType<string>;
export type NumberCollection = PrimitiveCollectionType<number>;
export type BooleanCollection = PrimitiveCollectionType<boolean>;
export type EnumCollection<T> = PrimitiveCollectionType<T>;

export type PrimitiveCollection = StringCollection | NumberCollection | BooleanCollection | EnumCollection<any>;

export abstract class QPrimitiveCollection<Type, QType extends QValuePathModel> extends QueryObject {
  public readonly it;

  constructor(prefix?: string, converter?: ValueConverter<any, Type>) {
    super(prefix);

    this.it = this.createQPathType(this.withPrefix(PRIMITIVE_VALUE_REFERENCE), converter);
  }

  abstract createQPathType(path: string, converter?: ValueConverter<any, any>): QType;

  public convertFromOData(odataModel: object | Array<object> | null | undefined) {
    if (odataModel === null || odataModel === undefined) {
      return odataModel;
    }

    const converter = this.it.converter;
    return !converter
      ? odataModel
      : Array.isArray(odataModel)
      ? odataModel.map((om) => converter.convertFrom(om))
      : converter.convertFrom(odataModel);
  }

  public convertToOData(userModel: Type | Array<Type> | null | undefined) {
    if (userModel === null || userModel === undefined) {
      return userModel;
    }

    const converter = this.it.converter;
    return !converter
      ? userModel
      : Array.isArray(userModel)
      ? userModel.map((um) => converter.convertTo(um))
      : converter.convertTo(userModel);
  }
}

export class QStringCollection extends QPrimitiveCollection<string, QStringPath> {
  createQPathType(path: string, converter?: ValueConverter<string, any>) {
    return new QStringPath(path, converter);
  }
}
export const qStringCollection = new QStringCollection();

export class QStringV2Collection extends QPrimitiveCollection<string, QStringV2Path> {
  createQPathType(path: string, converter?: ValueConverter<string, any>) {
    return new QStringV2Path(path, converter);
  }
}
export const qStringV2Collection = new QStringV2Collection();

export class QNumberCollection extends QPrimitiveCollection<number, QNumberPath> {
  createQPathType(path: string, converter?: ValueConverter<number, any>) {
    return new QNumberPath(path, converter);
  }
}
export const qNumberCollection = new QNumberCollection();

export class QBigNumberCollection extends QPrimitiveCollection<string, QBigNumberPath> {
  createQPathType(path: string, converter?: ValueConverter<string, any>) {
    return new QBigNumberPath(path, converter);
  }
}
export const qBigNumberCollection = new QBigNumberCollection();

export class QNumberV2Collection extends QPrimitiveCollection<number, QNumberV2Path> {
  createQPathType(path: string, converter?: ValueConverter<number, any>) {
    return new QNumberV2Path(path, converter);
  }
}
export const qNumberV2Collection = new QNumberV2Collection();

export class QStringNumberV2Collection extends QPrimitiveCollection<string, QStringNumberV2Path> {
  createQPathType(path: string, converter?: ValueConverter<string, any>) {
    return new QStringNumberV2Path(path, converter);
  }
}
export const qStringNumberV2Collection = new QStringNumberV2Collection();

export class QBooleanCollection extends QPrimitiveCollection<boolean, QBooleanPath> {
  createQPathType(path: string, converter?: ValueConverter<boolean, any>) {
    return new QBooleanPath(path, converter);
  }
}
export const qBooleanCollection = new QBooleanCollection();

export class QGuidCollection extends QPrimitiveCollection<string, QGuidPath> {
  createQPathType(path: string, converter?: ValueConverter<string, any>) {
    return new QGuidPath(path, converter);
  }
}
export const qGuidCollection = new QGuidCollection();

export class QGuidV2Collection extends QPrimitiveCollection<string, QGuidV2Path> {
  createQPathType(path: string, converter?: ValueConverter<string, any>) {
    return new QGuidV2Path(path, converter);
  }
}
export const qGuidV2Collection = new QGuidV2Collection();

export class QBinaryCollection extends QPrimitiveCollection<string, QBinaryPath> {
  createQPathType(path: string) {
    return new QBinaryPath(path);
  }
}
export const qBinaryCollection = new QBinaryCollection();

export class QDateTimeOffsetCollection extends QPrimitiveCollection<string, QDateTimeOffsetPath> {
  createQPathType(path: string, converter?: ValueConverter<string, any>) {
    return new QDateTimeOffsetPath(path, converter);
  }
}
export const qDateTimeOffsetCollection = new QDateTimeOffsetCollection();

export class QTimeOfDayCollection extends QPrimitiveCollection<string, QTimeOfDayPath> {
  createQPathType(path: string, converter?: ValueConverter<string, any>) {
    return new QTimeOfDayPath(path, converter);
  }
}
export const qTimeOfDayCollection = new QTimeOfDayCollection();

export class QDateCollection extends QPrimitiveCollection<string, QDatePath> {
  createQPathType(path: string, converter?: ValueConverter<string, any>) {
    return new QDatePath(path, converter);
  }
}
export const qDateCollection = new QDateCollection();

export class QTimeV2Collection extends QPrimitiveCollection<string, QTimeV2Path> {
  createQPathType(path: string, converter?: ValueConverter<string, any>) {
    return new QTimeV2Path(path, converter);
  }
}
export const qTimeV2Collection = new QTimeV2Collection();

export class QDateTimeV2Collection extends QPrimitiveCollection<string, QDateTimeV2Path> {
  createQPathType(path: string, converter?: ValueConverter<string, any>) {
    return new QDateTimeV2Path(path, converter);
  }
}
export const qDateTimeV2Collection = new QDateTimeV2Collection();

export class QDateTimeOffsetV2Collection extends QPrimitiveCollection<string, QDateTimeOffsetV2Path> {
  createQPathType(path: string, converter?: ValueConverter<string, any>) {
    return new QDateTimeOffsetV2Path(path, converter);
  }
}
export const qDateTimeOffsetV2Collection = new QDateTimeOffsetV2Collection();

export class QEnumCollection extends QPrimitiveCollection<string, QEnumPath> {
  createQPathType(path: string, converter?: ValueConverter<string, any>) {
    return new QEnumPath(path, converter);
  }
}
export const qEnumCollection = new QEnumCollection();
