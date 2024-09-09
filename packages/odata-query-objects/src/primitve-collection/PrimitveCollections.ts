import { NumericEnumLike, NumericEnumMember, StringEnumLike, StringEnumMember } from "../enum/EnumModel";
import { QEnumPath } from "../path/enum/QEnumPath";
import { QNumericEnumPath } from "../path/enum/QNumericEnumPath";
import { QBinaryPath } from "../path/QBinaryPath";
import { QBooleanPath } from "../path/QBooleanPath";
import { QDateTimeOffsetV2Path } from "../path/v2/QDateTimeOffsetV2Path";
import { QDateTimeV2Path } from "../path/v2/QDateTimeV2Path";
import { QGuidV2Path } from "../path/v2/QGuidV2Path";
import { QNumberV2Path } from "../path/v2/QNumberV2Path";
import { QStringNumberV2Path } from "../path/v2/QStringNumberV2Path";
import { QStringV2Path } from "../path/v2/QStringV2Path";
import { QTimeV2Path } from "../path/v2/QTimeV2Path";
import { QBigNumberPath } from "../path/v4/QBigNumberPath";
import { QDatePath } from "../path/v4/QDatePath";
import { QDateTimeOffsetPath } from "../path/v4/QDateTimeOffsetPath";
import { QGuidPath } from "../path/v4/QGuidPath";
import { QNumberPath } from "../path/v4/QNumberPath";
import { QStringPath } from "../path/v4/QStringPath";
import { QTimeOfDayPath } from "../path/v4/QTimeOfDayPath";
import { QPrimitiveCollection } from "./QPrimitiveCollection";

export class QStringCollection<ConvertedType = string> extends QPrimitiveCollection<
  string,
  ConvertedType,
  QStringPath<ConvertedType>
> {
  public readonly it = new QStringPath<ConvertedType>(this.withPrefix(), this.converter);
}

export class QStringV2Collection<ConvertedType = string> extends QPrimitiveCollection<
  string,
  ConvertedType,
  QStringV2Path<ConvertedType>
> {
  public readonly it = new QStringV2Path<ConvertedType>(this.withPrefix(), this.converter);
}

export class QNumberCollection<ConvertedType = number> extends QPrimitiveCollection<
  number,
  ConvertedType,
  QNumberPath<ConvertedType>
> {
  public readonly it = new QNumberPath<ConvertedType>(this.withPrefix(), this.converter);
}

export class QBigNumberCollection<ConvertedType = string> extends QPrimitiveCollection<
  string,
  ConvertedType,
  QBigNumberPath<ConvertedType>
> {
  public readonly it = new QBigNumberPath<ConvertedType>(this.withPrefix(), this.converter);
}

export class QNumberV2Collection<ConvertedType = number> extends QPrimitiveCollection<
  number,
  ConvertedType,
  QNumberV2Path<ConvertedType>
> {
  public readonly it = new QNumberV2Path<ConvertedType>(this.withPrefix(), this.converter);
}

export class QStringNumberV2Collection<ConvertedType = string> extends QPrimitiveCollection<
  string,
  ConvertedType,
  QStringNumberV2Path<ConvertedType>
> {
  public readonly it = new QStringNumberV2Path<ConvertedType>(this.withPrefix(), this.converter);
}

export class QBooleanCollection<ConvertedType = boolean> extends QPrimitiveCollection<
  boolean,
  ConvertedType,
  QBooleanPath<ConvertedType>
> {
  public readonly it = new QBooleanPath<ConvertedType>(this.withPrefix(), this.converter);
}

export class QGuidCollection<ConvertedType = string> extends QPrimitiveCollection<
  string,
  ConvertedType,
  QGuidPath<ConvertedType>
> {
  public readonly it = new QGuidPath<ConvertedType>(this.withPrefix(), this.converter);
}

export class QGuidV2Collection<ConvertedType = string> extends QPrimitiveCollection<
  string,
  ConvertedType,
  QGuidV2Path<ConvertedType>
> {
  public readonly it = new QGuidV2Path<ConvertedType>(this.withPrefix(), this.converter);
}

export class QBinaryCollection<ConvertedType = string> extends QPrimitiveCollection<
  string,
  ConvertedType,
  QBinaryPath
> {
  public readonly it = new QBinaryPath(this.withPrefix());
}

export class QDateTimeOffsetCollection<ConvertedType = string> extends QPrimitiveCollection<
  string,
  ConvertedType,
  QDateTimeOffsetPath<ConvertedType>
> {
  public readonly it = new QDateTimeOffsetPath<ConvertedType>(this.withPrefix(), this.converter);
}

export class QTimeOfDayCollection<ConvertedType = string> extends QPrimitiveCollection<
  string,
  ConvertedType,
  QTimeOfDayPath<ConvertedType>
> {
  public readonly it = new QTimeOfDayPath<ConvertedType>(this.withPrefix(), this.converter);
}

export class QDateCollection<ConvertedType = string> extends QPrimitiveCollection<
  string,
  ConvertedType,
  QDatePath<ConvertedType>
> {
  public readonly it = new QDatePath<ConvertedType>(this.withPrefix(), this.converter);
}

export class QTimeV2Collection<ConvertedType = string> extends QPrimitiveCollection<
  string,
  ConvertedType,
  QTimeV2Path<ConvertedType>
> {
  public readonly it = new QTimeV2Path<ConvertedType>(this.withPrefix(), this.converter);
}

export class QDateTimeV2Collection<ConvertedType = string> extends QPrimitiveCollection<
  string,
  ConvertedType,
  QDateTimeV2Path<ConvertedType>
> {
  public readonly it = new QDateTimeV2Path<ConvertedType>(this.withPrefix(), this.converter);
}

export class QDateTimeOffsetV2Collection<ConvertedType = string> extends QPrimitiveCollection<
  string,
  ConvertedType,
  QDateTimeOffsetV2Path<ConvertedType>
> {
  public readonly it = new QDateTimeOffsetV2Path<ConvertedType>(this.withPrefix(), this.converter);
}

export class QEnumCollection<EnumType extends StringEnumLike> extends QPrimitiveCollection<
  string,
  StringEnumMember<EnumType>,
  QEnumPath<EnumType>
> {
  readonly it: QEnumPath<EnumType>;

  constructor(theEnum: EnumType, prefix?: string) {
    super(prefix, undefined);
    this.it = new QEnumPath<EnumType>(this.withPrefix(), theEnum);
  }
}

export class QNumericEnumCollection<EnumType extends NumericEnumLike> extends QPrimitiveCollection<
  string,
  NumericEnumMember<EnumType>,
  QNumericEnumPath<EnumType>
> {
  readonly it: QNumericEnumPath<EnumType>;
  public constructor(theEnum: EnumType, prefix?: string) {
    super(prefix, undefined);
    this.it = new QNumericEnumPath(this.withPrefix(), theEnum);
  }
}
