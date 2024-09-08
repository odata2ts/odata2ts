import { ValueConverter } from "@odata2ts/converter-api";
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
  protected createQPathType(path: string, converter?: ValueConverter<string, ConvertedType>) {
    return new QStringPath(path, converter);
  }
}

export class QStringV2Collection<ConvertedType = string> extends QPrimitiveCollection<
  string,
  ConvertedType,
  QStringV2Path<ConvertedType>
> {
  protected createQPathType(path: string, converter?: ValueConverter<string, ConvertedType>) {
    return new QStringV2Path(path, converter);
  }
}

export class QNumberCollection<ConvertedType = number> extends QPrimitiveCollection<
  number,
  ConvertedType,
  QNumberPath<ConvertedType>
> {
  protected createQPathType(path: string, converter?: ValueConverter<number, ConvertedType>) {
    return new QNumberPath(path, converter);
  }
}

export class QBigNumberCollection<ConvertedType = string> extends QPrimitiveCollection<
  string,
  ConvertedType,
  QBigNumberPath<ConvertedType>
> {
  protected createQPathType(path: string, converter?: ValueConverter<string, ConvertedType>) {
    return new QBigNumberPath(path, converter);
  }
}

export class QNumberV2Collection<ConvertedType = number> extends QPrimitiveCollection<
  number,
  ConvertedType,
  QNumberV2Path<ConvertedType>
> {
  protected createQPathType(path: string, converter?: ValueConverter<number, ConvertedType>) {
    return new QNumberV2Path(path, converter);
  }
}

export class QStringNumberV2Collection<ConvertedType = string> extends QPrimitiveCollection<
  string,
  ConvertedType,
  QStringNumberV2Path<ConvertedType>
> {
  protected createQPathType(path: string, converter?: ValueConverter<string, ConvertedType>) {
    return new QStringNumberV2Path(path, converter);
  }
}

export class QBooleanCollection<ConvertedType = boolean> extends QPrimitiveCollection<
  boolean,
  ConvertedType,
  QBooleanPath<ConvertedType>
> {
  protected createQPathType(path: string, converter?: ValueConverter<boolean, ConvertedType>) {
    return new QBooleanPath(path, converter);
  }
}

export class QGuidCollection<ConvertedType = string> extends QPrimitiveCollection<
  string,
  ConvertedType,
  QGuidPath<ConvertedType>
> {
  protected createQPathType(path: string, converter?: ValueConverter<string, ConvertedType>) {
    return new QGuidPath(path, converter);
  }
}

export class QGuidV2Collection<ConvertedType = string> extends QPrimitiveCollection<
  string,
  ConvertedType,
  QGuidV2Path<ConvertedType>
> {
  protected createQPathType(path: string, converter?: ValueConverter<string, ConvertedType>) {
    return new QGuidV2Path(path, converter);
  }
}

export class QBinaryCollection<ConvertedType = string> extends QPrimitiveCollection<
  string,
  ConvertedType,
  QBinaryPath
> {
  protected createQPathType(path: string, converter?: ValueConverter<string, ConvertedType>) {
    return new QBinaryPath(path);
  }
}

export class QDateTimeOffsetCollection<ConvertedType = string> extends QPrimitiveCollection<
  string,
  ConvertedType,
  QDateTimeOffsetPath<ConvertedType>
> {
  protected createQPathType(path: string, converter?: ValueConverter<string, ConvertedType>) {
    return new QDateTimeOffsetPath(path, converter);
  }
}

export class QTimeOfDayCollection<ConvertedType = string> extends QPrimitiveCollection<
  string,
  ConvertedType,
  QTimeOfDayPath<ConvertedType>
> {
  protected createQPathType(path: string, converter?: ValueConverter<string, ConvertedType>) {
    return new QTimeOfDayPath(path, converter);
  }
}

export class QDateCollection<ConvertedType = string> extends QPrimitiveCollection<
  string,
  ConvertedType,
  QDatePath<ConvertedType>
> {
  protected createQPathType(path: string, converter?: ValueConverter<string, ConvertedType>) {
    return new QDatePath(path, converter);
  }
}

export class QTimeV2Collection<ConvertedType = string> extends QPrimitiveCollection<
  string,
  ConvertedType,
  QTimeV2Path<ConvertedType>
> {
  protected createQPathType(path: string, converter?: ValueConverter<string, ConvertedType>) {
    return new QTimeV2Path(path, converter);
  }
}

export class QDateTimeV2Collection<ConvertedType = string> extends QPrimitiveCollection<
  string,
  ConvertedType,
  QDateTimeV2Path<ConvertedType>
> {
  protected createQPathType(path: string, converter?: ValueConverter<string, ConvertedType>) {
    return new QDateTimeV2Path(path, converter);
  }
}

export class QDateTimeOffsetV2Collection<ConvertedType = string> extends QPrimitiveCollection<
  string,
  ConvertedType,
  QDateTimeOffsetV2Path<ConvertedType>
> {
  protected createQPathType(path: string, converter?: ValueConverter<string, ConvertedType>) {
    return new QDateTimeOffsetV2Path(path, converter);
  }
}

export class QEnumCollection<EnumType extends StringEnumLike> extends QPrimitiveCollection<
  string,
  StringEnumMember<EnumType>,
  QEnumPath<EnumType>
> {
  constructor(
    protected theEnum: EnumType,
    prefix?: string,
  ) {
    super(prefix, undefined, theEnum);
  }

  protected createQPathType(path: string) {
    return new QEnumPath<EnumType>(path, this.extraData);
  }
}

export class QNumericEnumCollection<EnumType extends NumericEnumLike> extends QPrimitiveCollection<
  string,
  NumericEnumMember<EnumType>,
  QNumericEnumPath<EnumType>
> {
  public constructor(theEnum: EnumType, prefix?: string) {
    super(prefix, undefined, theEnum);
  }

  protected createQPathType(path: string): QNumericEnumPath<EnumType> {
    return new QNumericEnumPath(path, this.extraData);
  }
}
