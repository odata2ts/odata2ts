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

/**
 * Specify structure of entity via generics.
 *
 * For example: Creating an entity for type 'MyTestInterface' with composite key
 * QEntityModel<MyTestInterface, "name" | "application">
 */
export type QEntityModel<TypeModel, EnumTypes = null> = QPropContainer<Required<TypeModel>, EnumTypes>;

/**
 * Helper function to "unpack" an array type; leaves non-arrays untouched.
 * => Unpack = Array<T> becomes T
 */
type Unpacked<T> = T extends (infer U)[] ? U : T;

/**
 * Maps data types to QPath equivalents.
 * Heavily relies on <em>Conditional Types</em>.
 *
 * Nominal types (date & time stuff) must come first, otherwise string would win in this case.
 */
export type QPropContainer<TypeModel, EnumTypes> = {
  [Property in keyof TypeModel as Property extends string
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
    : TypeModel[Property] extends Boolean
    ? QBooleanPath
    : TypeModel[Property] extends Number
    ? QNumberPath
    : TypeModel[Property] extends EnumTypes
    ? QEnumPath
    : TypeModel[Property] extends string
    ? QStringPath
    : TypeModel[Property] extends Array<any>
    ? QCollectionPath<Unpacked<TypeModel[Property]>, EnumTypes>
    : QEntityPath<TypeModel[Property], EnumTypes>;
};
