import { QStringPath } from "./path/QStringPath";
import { QEntityModel, QPropContainer } from "./QEntityModel";

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
