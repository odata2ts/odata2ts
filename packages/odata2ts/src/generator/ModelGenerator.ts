import { ODataVersions } from "@odata2ts/odata-core";
import { JSDocStructure, OptionalKind, PropertySignatureStructure, StructureKind } from "ts-morph";
import { DataModel } from "../data-model/DataModel.js";
import { ComplexType, DataTypes, EntityType, OperationType, PropertyModel } from "../data-model/DataTypeModel.js";
import { NamingHelper } from "../data-model/NamingHelper.js";
import { EntityBasedGeneratorFunction, GeneratorFunctionOptions } from "../FactoryFunctionModel.js";
import { Modes } from "../OptionModel.js";
import { FileHandler } from "../project/FileHandler.js";
import { ProjectManager } from "../project/ProjectManager.js";
import { CoreImports } from "./import/ImportObjects.js";
import { ImportContainer } from "./ImportContainer.js";

/**
 * Stream properties are left out of every generated model: `Edm.Stream` content is not part of the
 * entity's JSON payload, it lives behind its own URL. Typing it as a string would promise a value that
 * no server ever sends.
 */
function notStream(prop: PropertyModel): boolean {
  return !prop.isStream;
}

export const generateModels: EntityBasedGeneratorFunction = (
  project: ProjectManager,
  dataModel,
  version,
  options,
  namingHelper,
) => {
  const generator = new ModelGenerator(project, dataModel, version, options, namingHelper);
  return generator.generate();
};

class ModelGenerator {
  constructor(
    private project: ProjectManager,
    private dataModel: DataModel,
    private version: ODataVersions,
    private options: GeneratorFunctionOptions,
    private namingHelper: NamingHelper,
  ) {}

  public async generate(): Promise<void> {
    this.project.initModels();

    const promises: Array<Promise<void>> = [
      ...this.generateEnums(),
      ...this.generateEntityTypeModels(),
      ...this.generateComplexTypeModels(),
    ];

    if (!this.options.skipOperations) {
      promises.push(this.generateUnboundOperationParams());
    }

    await Promise.all(promises);

    return this.project.finalizeModels();
  }

  private generateEnums() {
    return this.dataModel.getEnums().map((et) => {
      const file = this.project.createOrGetModelFile(et.folderPath, et.modelName);

      const enumType = this.options.enumType;
      if (enumType === "string-union") {
        file.getFile().addTypeAlias({
          name: et.modelName,
          isExported: true,
          type: et.members.map((mem) => `"${mem.name}"`).join(" | "),
        });
      } else {
        file.getFile().addEnum({
          name: et.modelName,
          isExported: true,
          members: et.members.map((mem) => ({
            name: mem.name,
            initializer: enumType === "numeric" ? String(mem.value) : `"${mem.name}"`,
          })),
        });
      }

      return this.project.finalizeFile(file);
    });
  }

  private generateEntityTypeModels() {
    return this.dataModel.getEntityTypes().map((model) => {
      const file = this.project.createOrGetModelFile(model.folderPath, model.modelName, [
        model.modelName,
        model.id.modelName,
        model.editableName,
      ]);

      // query model
      this.generateModel(file, model);

      // key model
      if (!this.options.skipIdModels && model.generateId) {
        this.generateIdModel(file, model);
      }

      // editable model
      if (!this.options.skipEditableModels) {
        this.generateEditableModel(file, model);
      }

      // param models for bound operations
      if (!this.options.skipOperations) {
        [
          ...this.dataModel.getEntityTypeOperations(model.fqName),
          ...this.dataModel.getEntitySetOperations(model.fqName),
        ].forEach((operation) => {
          this.generateOperationParams(file, operation);
        });
      }

      return this.project.finalizeFile(file);
    });
  }

  private generateComplexTypeModels() {
    return this.dataModel.getComplexTypes().map((model) => {
      const file = this.project.createOrGetModelFile(model.folderPath, model.modelName, [
        model.modelName,
        model.editableName,
      ]);

      // query model
      this.generateModel(file, model);

      // editable model
      if (!this.options.skipEditableModels) {
        this.generateEditableModel(file, model);
      }

      return this.project.finalizeFile(file);
    });
  }

  private generateModel(file: FileHandler, model: ComplexType | EntityType) {
    const imports = file.getImports();
    let extendsClause = undefined;
    if (model.finalBaseClass) {
      const modelName = imports.addGeneratedModel(
        model.baseClasses[0],
        this.namingHelper.getModelName(model.finalBaseClass),
      );
      extendsClause = [modelName];
    }

    file.getFile().addInterface({
      name: model.modelName,
      isExported: true,
      // stream properties are absent on purpose: binary content never travels in the JSON payload, it
      // is addressed by its own URL - see the stream service the ServiceGenerator emits for them
      properties: model.props.filter(notStream).map((p) => {
        const isEntity = p.dataType == DataTypes.ModelType;
        return {
          name: p.name,
          type: this.getPropType(file.getImports(), p),
          // props for entities or entity collections are not added in V4 if not explicitly expanded
          hasQuestionToken: this.dataModel.isV4() && isEntity,
          docs: this.options.skipComments ? undefined : [this.generatePropDoc(p, model)],
        };
      }),
      extends: extendsClause,
    });
  }

  private generatePropDoc(prop: PropertyModel, model: ComplexType | EntityType): OptionalKind<JSDocStructure> {
    const isKeyProp = (model as EntityType).keyNames?.includes(prop.odataName);
    const baseAttribs: Array<string> = [];
    if (isKeyProp) {
      baseAttribs.push("**Key Property**: This is a key property used to identify the entity.");
    }
    if (prop.managed) {
      baseAttribs.push("**Managed**: This property is managed on the server side and cannot be edited.");
    }
    if (prop.converters?.length) {
      baseAttribs.push(`**Applied Converters**: ${prop.converters.map((c) => c.converterId).join(",")}.`);
    }

    const attributeTable: Array<[string, string]> = [
      ["Name", prop.odataName],
      ["Type", prop.odataType],
    ];
    if (prop.required) {
      attributeTable.push(["Nullable", "false"]);
    }

    const description =
      (baseAttribs ? baseAttribs.join("<br/>") + "\n\n" : "") +
      "OData Attributes:\n" +
      "|Attribute Name | Attribute Value |\n| --- | ---|\n" +
      attributeTable.map((row) => `| ${row[0]} | \`${row[1]}\` |`).join("\n");

    return { kind: StructureKind.JSDoc, description };
  }

  private getPropType(imports: ImportContainer, prop: PropertyModel): string {
    // V2 entity special: deferred content
    let suffix = "";
    if (this.dataModel.isV2() && prop.dataType == DataTypes.ModelType) {
      const defContent = imports.addCoreLib(this.version, CoreImports.DeferredContent);
      suffix = ` | ${defContent}`;
    }

    let typeName: string;
    if (prop.dataType === DataTypes.PrimitiveType) {
      // custom types which require type imports => possible via converters
      typeName = prop.typeModule ? imports.addCustomType(prop.typeModule, prop.type, true) : prop.type;
    } else {
      typeName = imports.addGeneratedModel(prop.fqType, prop.type);
    }

    // Collections
    if (prop.isCollection) {
      const type = `Array<${typeName}>`;
      if (this.dataModel.isV2() && this.options.v2ModelsWithExtraResultsWrapping) {
        return `{ results: ${type} }` + suffix;
      } else {
        return type + suffix;
      }
    }

    // primitive, enum & complex types
    return typeName + (prop.required ? "" : " | null") + suffix;
  }

  private generateIdModel(file: FileHandler, model: EntityType) {
    const singleType = model.keys.length === 1 ? `${model.keys[0].type} | ` : "";
    const keyTypes = model.keys
      .map((keyProp) => `${keyProp.name}: ${this.getPropType(file.getImports(), keyProp)}`)
      .join(",");
    const type = `${singleType}{${keyTypes}}`;

    file.getFile().addTypeAlias({
      name: model.id.modelName,
      isExported: true,
      type,
    });
  }

  private generateEditableModel(file: FileHandler, model: ComplexType) {
    const entityTypes = [DataTypes.ModelType, DataTypes.ComplexType];
    // stream props are not writable through the payload either - the stream service is the only way in
    const allProps = [...model.baseProps, ...model.props].filter((p) => !p.managed && notStream(p));

    const requiredProps = allProps
      .filter((p) => p.required && !entityTypes.includes(p.dataType))
      .map((p) => `"${p.name}"`)
      .join(" | ");
    const optionalProps = allProps
      .filter((p) => !p.required && !entityTypes.includes(p.dataType))
      .map((p) => `"${p.name}"`)
      .join(" | ");
    const complexProps = allProps.filter((p) => p.dataType === DataTypes.ComplexType);
    const navProps = this.generateNavProps(
      file.getImports(),
      model.fqName,
      allProps.filter((p) => p.dataType === DataTypes.ModelType),
    );

    const extendsClause = [
      requiredProps ? `Pick<${model.modelName}, ${requiredProps}>` : null,
      optionalProps ? `Partial<Pick<${model.modelName}, ${optionalProps}>>` : null,
    ].filter((e): e is string => !!e);

    file.getFile().addInterface({
      name: model.editableName,
      isExported: true,
      extends: extendsClause,
      properties: [
        ...complexProps.map((p) => {
          return {
            name: p.name,
            type: this.getEditablePropType(file.getImports(), p),
            // optional props don't need to be specified in editable model
            // also, entities would require deep insert func => we make it optional for now
            hasQuestionToken: !p.required || p.dataType === DataTypes.ModelType,
          };
        }),
        ...navProps,
      ],
    });
  }

  /**
   * Whether a binding is stated by the key of the referenced entity instead of by its URL, which is only
   * possible where a service is generated: the URL is assembled at runtime, by the query objects, and
   * those only take part in a request when there is a service to issue it.
   */
  private bindsByKey() {
    return this.options.mode === Modes.service || this.options.mode === Modes.all;
  }

  /**
   * A navigation property can be bound to an already existing entity, as long as that entity is
   * addressable by a URL - which requires it to have a key.
   *
   * Where the binding is stated by key, two more things have to be in place: the id model, which is the
   * shape of that key, and the entity set the navigation property points to, since the URL is built from
   * it. Neither is inferable, so a navigation property missing one of them gets no binding at all.
   */
  private isBindableNavProp(ownerFqName: string, prop: PropertyModel) {
    if (!this.options.enableBindingProps || prop.dataType !== DataTypes.ModelType) {
      return false;
    }
    const target = this.dataModel.getEntityType(prop.fqType);
    if (!target?.keyNames.length) {
      return false;
    }
    if (!this.bindsByKey()) {
      return true;
    }
    return (
      !this.options.skipIdModels &&
      target.generateId &&
      !!this.dataModel.getNavPropBindingTarget(ownerFqName, prop.odataName)
    );
  }

  /**
   * The navigation properties of an editable model, which carry two independent, opt-in features:
   *
   * - binding an existing entity to the navigation property (issue #38)
   * - deep insert / deep update, i.e. the related entity travelling within this entity's payload (#237)
   *
   * Where a service is generated, both go by the mapped name of the navigation property and are told
   * apart by the {@code "@id"} property, which carries the key of the entity to bind. The query objects
   * turn that key into the notation of the targeted OData version when the request is converted, so the
   * user never has to spell out a URL they would have to assemble themselves.
   *
   * Without a service there is nothing to do that conversion, so the binding is stated as it goes on the
   * wire: by the OData name, since that notation is passed through the query object untouched. It meets
   * the deep insert in V2 and 4.01, where a binding goes by the very name of the navigation property, so
   * the property accepts either shape there; 4.0 spells it as {@code "Category@odata.bind"} and therefore
   * keeps the two apart. A deep insert is addressed by the mapped name in either case: its payload *is*
   * converted, so the property has to be the one the query object knows.
   */
  private generateNavProps(
    imports: ImportContainer,
    ownerFqName: string,
    props: Array<PropertyModel>,
  ): Array<OptionalKind<PropertySignatureStructure>> {
    const isV2 = this.version === ODataVersions.V2;
    const isV401 = !isV2 && this.options.odataVersionV4 === "4.01";
    // in these versions a binding has no name of its own, so it shares the property with a deep insert
    const bindingByPropName = isV2 || isV401;
    const byKey = this.bindsByKey();

    return props.flatMap((prop) => {
      const deepInsert = this.options.enableDeepInsertProps;
      const bindable = this.isBindableNavProp(ownerFqName, prop);

      // one entry per resulting property name, so that renaming cannot merge what belongs apart
      const byName = new Map<string, { shapes: Array<string>; docs: Array<string>; binds: boolean }>();
      const collect = (name: string, shape: string, doc: string, binds: boolean) => {
        const entry = byName.get(name) ?? { shapes: [], docs: [], binds: false };
        entry.shapes.push(shape);
        entry.docs.push(doc);
        entry.binds ||= binds;
        byName.set(name, entry);
      };

      if (deepInsert) {
        const editableName = this.dataModel.getComplexType(prop.fqType)!.editableName;
        collect(
          prop.name,
          imports.addGeneratedModel(prop.fqType, editableName),
          `Create "${prop.name}" along with this entity (deep insert), or update it along with it (deep update).`,
          false,
        );
      }
      if (bindable) {
        if (byKey) {
          const target = this.dataModel.getEntityType(prop.fqType)!;
          const idName = imports.addGeneratedModel(prop.fqType, target.id.modelName);
          collect(
            prop.name,
            `{ "@id": ${idName} }`,
            `Bind "${prop.name}" to an already existing entity by its key.`,
            true,
          );
        } else {
          collect(
            bindingByPropName ? prop.odataName : `${prop.odataName}@odata.bind`,
            isV2 ? `{ __metadata: { uri: string } }` : isV401 ? `{ "@id": string }` : "string",
            `Bind "${prop.name}" to an already existing entity by its URL.`,
            true,
          );
        }
      }

      return [...byName.entries()].map(([name, { shapes, docs, binds }]) => {
        return {
          // the binding notation is no identifier, so the name must be quoted
          name: `"${name}"`,
          type: this.getNavPropType(prop, shapes, binds),
          hasQuestionToken: true,
          docs: this.options.skipComments ? undefined : [{ description: docs.join("\n") }],
        };
      });
    });
  }

  /**
   * Decorates the accepted shapes of a navigation property with cardinality and nullability.
   *
   * Removing a binding is only possible for a nullable single-valued navigation property, by setting it to
   * null. Collection-valued bind operations add to the collection, they never replace it, so there is
   * nothing to remove with - that requires $ref, which odata2ts doesn't support yet. A deep insert has no
   * such notion at all, hence null is only offered on a property which actually accepts a binding - in 4.0
   * that is the separate {@code @odata.bind} property, not the one carrying the nested entity.
   */
  private getNavPropType(prop: PropertyModel, shapes: Array<string>, bindable: boolean): string {
    const singleType = shapes.join(" | ");

    if (prop.isCollection) {
      const collectionType = `Array<${singleType}>`;
      // some V2 services expect the extra results wrapping in the payload as well, see issue #237
      return this.version === ODataVersions.V2 && this.options.v2EditableModelsWithExtraResultsWrapping
        ? `{ results: ${collectionType} }`
        : collectionType;
    }

    return singleType + (bindable && !prop.required ? " | null" : "");
  }

  private getEditablePropType(imports: ImportContainer, prop: PropertyModel): string {
    const isModelType = [DataTypes.ModelType, DataTypes.ComplexType].includes(prop.dataType);

    let editableType = prop.type;
    if (isModelType) {
      const editName = this.dataModel.getComplexType(prop.fqType)!.editableName;
      editableType = imports.addGeneratedModel(prop.fqType, editName);
    }

    // Collections
    if (prop.isCollection) {
      return `Array<${editableType}>`;
    }

    // primitive, enum & complex types
    return editableType + (prop.required ? "" : " | null");
  }

  private async generateUnboundOperationParams() {
    const unboundOps = this.dataModel.getUnboundOperationTypes();
    const reservedNames = unboundOps.map((op) => op.paramsModelName);
    const file = this.project.createOrGetMainModelFile(reservedNames);

    unboundOps.forEach((operation) => {
      this.generateOperationParams(file, operation);
    });
  }

  private generateOperationParams(file: FileHandler, operation: OperationType) {
    const paramSets = [operation.parameters, ...(operation.overrides ?? [])].filter((pSet) => !!pSet.length);

    // standard: one interface for parameters
    if (paramSets.length === 1) {
      file.getFile().addInterface({
        name: operation.paramsModelName,
        isExported: true,
        properties: paramSets[0].map((p) => {
          return {
            name: p.name,
            type: this.getPropType(file.getImports(), p),
            hasQuestionToken: !p.required,
          };
        }),
      });
    }
    // function overload: one type with intersections of different param models
    else if (paramSets.length > 1) {
      file.getFile().addTypeAlias({
        name: operation.paramsModelName,
        isExported: true,
        type: (writer) => {
          paramSets.forEach((pSet, index) => {
            writer.block(() => {
              pSet.forEach((param, index) => {
                const paramType = this.getPropType(file.getImports(), param);
                writer.write(`${param.name}${param.required ? "" : "?"}: ${paramType}`);
                if (index < pSet.length - 1) {
                  writer.write(",");
                }
              });
            });
            if (index < paramSets.length - 1) {
              writer.write(" | ");
            }
          });
        },
      });
    }
  }
}
