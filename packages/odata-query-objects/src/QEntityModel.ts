import {
  DateCollection,
  TimeOfDayCollection,
  DateTimeOffsetCollection,
  BinaryCollection,
  GuidCollection,
  BooleanCollection,
  NumberCollection,
  StringCollection,
  EnumCollection,
} from "./QSingletons";
import { QEnumPath } from "./path/QEnumPath";
import { BinaryString, DateString, DateTimeOffsetString, GuidString, TimeOfDayString } from "./odata/ODataTypes";
import { QDatePath } from "./path/date-time-v4/QDatePath";
import { QDateTimeOffsetPath } from "./path/date-time-v4/QDateTimeOffsetPath";
import { QTimeOfDayPath } from "./path/date-time-v4/QTimeOfDayPath";
import { QCollectionPath } from "./path/QCollectionPath";
import { QEntityPath } from "./path/QEntityPath";
import { QNumberPath } from "./path/QNumberPath";
import { QStringPath } from "./path/QStringPath";
import { QBooleanPath } from "./path/QBooleanPath";
import { QBinaryPath } from "./path/QBinaryPath";
import { QGuidPath } from "./path/QGuidPath";
import { QEntityCollectionPath } from "./path/QEntityCollectionPath";

/**
 * Specify structure of entity via generics.
 *
 * For example: Creating an entity for type 'MyTestInterface' with enum props "features" & "favFeature"
 * QEntityModel<MyTestInterface, "features" | "favFeature">
 */
export type QEntityModel<TypeModel, EnumTypes = null> = QPropContainer<Required<TypeModel>, EnumTypes>;

/**
 * Helper function to "unpack" an array type; leaves non-arrays untouched.
 * => Unpack = Array<T> becomes T
 */
type Unpacked<T> = T extends (infer U)[] ? U : T;

/**
 * Converts all nominal types, e.g. DateString, GuidString, etc, to plain old strings.
 */
export type Unnominalized<T> = {
  [P in keyof T]: T[P] extends string ? string : T[P];
};

/**
 * Maps data types to QPath equivalents.
 * Heavily relies on <em>Conditional Types</em>.
 *
 * Nominal types (date & time stuff) must come first, otherwise string would win in this case.
 */
export type QPropContainer<TypeModel, EnumTypes> = {
  [Property in keyof TypeModel as Property extends "ID"
    ? Lowercase<Property>
    : Property extends string
    ? Uncapitalize<Property>
    : never]: TypeModel[Property] extends DateString
    ? QDatePath
    : TypeModel[Property] extends TimeOfDayString
    ? QTimeOfDayPath
    : TypeModel[Property] extends DateTimeOffsetString
    ? QDateTimeOffsetPath
    : TypeModel[Property] extends BinaryString
    ? QBinaryPath
    : TypeModel[Property] extends GuidString
    ? QGuidPath
    : TypeModel[Property] extends boolean
    ? QBooleanPath
    : TypeModel[Property] extends number
    ? QNumberPath
    : TypeModel[Property] extends EnumTypes
    ? QEnumPath
    : TypeModel[Property] extends string
    ? QStringPath
    : TypeModel[Property] extends Array<string | number | boolean | EnumTypes>
    ? QCollectionPath<CollectionMapper<Unpacked<TypeModel[Property]>>>
    : TypeModel[Property] extends Array<object>
    ? QEntityCollectionPath<Unpacked<TypeModel[Property]>, EnumTypes>
    : QEntityPath<TypeModel[Property], EnumTypes>;
};

export type CollectionMapper<Type> = Type extends DateString
  ? DateCollection
  : Type extends TimeOfDayString
  ? TimeOfDayCollection
  : Type extends DateTimeOffsetString
  ? DateTimeOffsetCollection
  : Type extends BinaryString
  ? BinaryCollection
  : Type extends GuidString
  ? GuidCollection
  : Type extends boolean
  ? BooleanCollection
  : Type extends number
  ? NumberCollection
  : Type extends string
  ? StringCollection
  : EnumCollection<Type>;
