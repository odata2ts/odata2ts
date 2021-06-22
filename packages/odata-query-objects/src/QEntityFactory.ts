import { QBooleanPath } from "./QBooleanPath";
import { QNumberPath } from "./QNumberPath";
import { QStringPath } from "./QStringPath";
import { QEntityPath } from "./QEntityPath";
import { QDatePath } from "./date-time-v4/QDatePath";
import { DateString, DateTimeOffsetString, TimeOfDayString } from "./ODataTypes";
import { QTimeOfDayPath } from "./date-time-v4/QTimeOfDayPath";
import { QDateTimeOffsetPath } from "./date-time-v4/QDateTimeOffsetPath";
import { QEntityCollectionPath } from "./QEntityCollectionPath";

/**
 * Specify type & key (id) structure of entity via generics.
 *
 * For example: Creating an entity for type 'MyTestInterface' with composite key
 * QEntityModel<MyTestInterface, "name" | "application">
 */
export type QEntityModel<TypeModel, KeyModel extends keyof TypeModel> = {
  entityName: string;
  createKey: (keys: { [Key in KeyModel]: TypeModel[Key] }) => string;
} & QPropContainer<TypeModel>;

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

export class QEntityFactory {
  /**
   * Factory function to create a QEntity based on a given type (TypeModel) in a type-safe manner.
   * Possible properties are checked via automatic type mapping.
   *
   * @param entityName
   * @param props
   * @returns
   */
  static create<TypeModel, KeyModel extends keyof TypeModel>(
    entityName: string,
    props: QPropContainer<Required<TypeModel>>
  ): QEntityModel<Required<TypeModel>, KeyModel> {
    return {
      ...props,
      entityName: entityName,
      createKey: (keys: { [Key in KeyModel]: TypeModel[Key] }): string => {
        return Object.entries(keys)
          .map(([key, value]) => {
            const prop = props[key as keyof TypeModel];
            const val = prop && prop instanceof QStringPath ? `'${value}'` : value;
            return key + "=" + val;
          })
          .join(",");
      },
    };
  }
}
