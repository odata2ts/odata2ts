import { DateString, DateTimeOffsetString, TimeOfDayString } from "./odata/ODataTypes";
import { QDatePath } from "./path/date-time-v4/QDatePath";
import { QDateTimeOffsetPath } from "./path/date-time-v4/QDateTimeOffsetPath";
import { QTimeOfDayPath } from "./path/date-time-v4/QTimeOfDayPath";
import { QEntityCollectionPath } from "./path/QEntityCollectionPath";
import { QEntityPath } from "./path/QEntityPath";
import { QNumberPath } from "./path/QNumberPath";
import { QStringPath } from "./path/QStringPath";
import { QBooleanPath } from "./path/QBooleanPath";

/**
 * Specify type & key (id) structure of entity via generics.
 *
 * For example: Creating an entity for type 'MyTestInterface' with composite key
 * QEntityModel<MyTestInterface, "name" | "application">
 */
export type QEntityModel<TypeModel, KeyModel extends keyof TypeModel> = {
  /**
   * OData path for the given entity collection.
   */
  __collectionPath: string;
} & QPropContainer<Required<TypeModel>>;

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
export type QPropContainer<TypeModel> = {
  [Property in keyof TypeModel]: TypeModel[Property] extends DateString
    ? QDatePath
    : TypeModel[Property] extends TimeOfDayString
    ? QTimeOfDayPath
    : TypeModel[Property] extends DateTimeOffsetString
    ? QDateTimeOffsetPath
    : TypeModel[Property] extends Boolean
    ? QBooleanPath
    : TypeModel[Property] extends Number
    ? QNumberPath
    : TypeModel[Property] extends string
    ? QStringPath
    : TypeModel[Property] extends Array<any>
    ? QEntityCollectionPath<Unpacked<TypeModel[Property]>>
    : QEntityPath<TypeModel[Property]>;
};
