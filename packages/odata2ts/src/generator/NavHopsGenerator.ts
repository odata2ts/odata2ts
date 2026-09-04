import { DataModel } from "../data-model/DataModel.js";
import { DataTypes } from "../data-model/DataTypeModel.js";

/**
 * The full source of the generated `CacheKeyNavHops.ts` file: one flat object, every entity type's own
 * navigation properties (contained ones included - they still have a declared type and a name, and
 * `touchesResource`'s scan doesn't care whether an entity set backs them), keyed by the type's FQN, then
 * by each property's mapped (TypeScript-facing) name.
 *
 * Built as a string, the same way other single-literal emissions in this generator are (see
 * `entityTypeName`'s `initializer` in `ServiceGenerator.ts`) - a flat data literal has no need for
 * `ts-morph`'s structured class/property API.
 */
export function buildNavHopsTableSource(dataModel: DataModel): string {
  const typeEntries: Array<string> = [];

  for (const entityType of dataModel.getEntityTypes()) {
    const navProps = [...entityType.baseProps, ...entityType.props].filter(
      (prop) => prop.dataType === DataTypes.ModelType,
    );
    if (!navProps.length) {
      continue;
    }

    const propEntries = navProps
      .map(
        (prop) =>
          `    ${JSON.stringify(prop.name)}: [${JSON.stringify(prop.fqType)}, "${
            prop.isCollection ? "list" : "detail"
          }", ${JSON.stringify(prop.odataName)}]`,
      )
      .join(",\n");

    typeEntries.push(`  ${JSON.stringify(entityType.fqName)}: {\n${propEntries},\n  }`);
  }

  return (
    `import type { NavHopsTable } from "@odata2ts/odata-query-builder";\n\n` +
    `export const CACHE_KEY_NAV_HOPS: NavHopsTable = {\n${typeEntries.join(",\n")}\n};\n`
  );
}
