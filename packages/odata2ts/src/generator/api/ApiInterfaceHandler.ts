import { ODataVersions } from "@odata2ts/odata-core";
import { InterfaceDeclarationStructure, MethodSignatureStructure, OptionalKind } from "ts-morph";

import { ComplexType, DataTypes, EntityType, PropertyModel } from "../../data-model/DataTypeModel";
import { NamingHelper } from "../../data-model/NamingHelper";
import { ServiceImports } from "../import/ImportObjects";
import { ImportContainer } from "../ImportContainer";

export class ApiInterfaceHandler {
  private typeParameter: string | undefined;
  private methods: Array<OptionalKind<MethodSignatureStructure>> = [];

  constructor(
    private name: string,
    private imports: ImportContainer,
    private namingHelper: NamingHelper,
    private version: ODataVersions
  ) {}

  public setTypeParameter(type: string) {
    this.typeParameter = type;
  }

  public addMethod(structure: OptionalKind<MethodSignatureStructure>) {
    this.methods.push(structure);
  }

  public addEntityGetter(name: string, entityType: EntityType) {
    const idType = this.imports.addGeneratedModel(entityType.id.fqName, entityType.id.modelName);

    const serviceApiName = this.namingHelper.getServiceApiName(entityType.name);
    const serviceCollectionApiName = this.namingHelper.getServiceCollectionApiName(entityType.name);

    this.methods.push({
      name,
      parameters: [],
      returnType: `${serviceCollectionApiName}<ClientType>`,
    });

    // this.methods.push({
    //   name,
    //   parameters: [
    //     {
    //       name: "id",
    //       type: idType,
    //     },
    //   ],
    //   returnType: `${serviceApiName}<ClientType>`,
    // });

    return [serviceApiName, serviceCollectionApiName];
  }

  public addSingletonGetter(name: string, entityType: EntityType): string {
    const type = this.namingHelper.getServiceApiName(entityType.name);
    const returnType = `${type}<ClientType>`;

    this.methods.push({
      name,
      returnType,
    });

    return returnType;
  }

  public addModelPropGetter(name: string, prop: PropertyModel, model: ComplexType): string {
    const isComplexCollection = prop.isCollection && model.dataType === DataTypes.ComplexType;
    const genModel = this.imports.addGeneratedModel(model.fqName, model.modelName);
    const genQObject = this.imports.addGeneratedQObject(model.fqName, model.qName);
    const genEditableModel = this.imports.addGeneratedModel(model.fqName, model.editableName);

    const type = isComplexCollection
      ? this.imports.addServiceObject(this.version, ServiceImports.CollectionService)[0]
      : prop.isCollection
      ? this.namingHelper.getServiceCollectionApiName(model.name)
      : this.namingHelper.getServiceApiName(model.name);

    const returnType = isComplexCollection
      ? `${type}<ClientType, ${genModel}, ${genQObject}, ${genEditableModel}>`
      : `${type}<ClientType>`;

    this.methods.push({
      name,
      returnType,
    });

    return returnType;
  }

  public buildInterface(): OptionalKind<InterfaceDeclarationStructure> {
    return {
      isExported: true,
      name: this.name,
      typeParameters: this.typeParameter ? [this.typeParameter] : undefined,
      methods: this.methods,
    };
  }
}
