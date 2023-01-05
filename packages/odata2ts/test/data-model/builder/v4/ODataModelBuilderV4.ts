import {
  NavigationPropertyBinding,
  Singleton,
  ODataEdmxModelV4,
  SchemaV4,
  EntitySetV4,
  EntityTypeV4,
  ComplexTypeV4,
} from "../../../../src/data-model/edmx/ODataEdmxModelV4";
import { ODataVersion } from "../../../../src/data-model/DataTypeModel";
import { ODataEntityTypeBuilderV4 } from "./ODataEntityTypeBuilderV4";
import { ODataComplexTypeBuilderV4 } from "./ODataComplexTypeBuilderV4";
import { ODataOperationBuilderV4 } from "./ODataOperationBuilderV4";
import { ODataModelBuilder } from "../ODataModelBuilder";

export interface NavProp {
  path: string;
  target: string;
}
export type NavProps = Array<NavProp>;
export interface NavPropsItem {
  NavigationPropertyBinding?: Array<NavigationPropertyBinding>;
}

export class ODataModelBuilderV4 extends ODataModelBuilder<ODataEdmxModelV4, SchemaV4, EntityTypeV4, ComplexTypeV4> {
  constructor(serviceName: string) {
    super(serviceName);
  }

  protected createVersionedModel(): ODataEdmxModelV4 {
    return this.createModel(ODataVersion.V4);
  }

  protected createVersionedSchema(): SchemaV4 {
    return this.createSchema();
  }

  private addNavProps(navPropsItem: NavPropsItem, navProps: NavProps) {
    if (navProps.length) {
      navPropsItem.NavigationPropertyBinding = navProps.map((np) => ({
        $: {
          Path: np.path,
          Target: np.target,
        },
      }));
    }
  }

  public addEntitySet(name: string, entityType: string, navProps: NavProps = []) {
    const container = this.getEntityContainer();
    if (!container.EntitySet) {
      container.EntitySet = [];
    }

    const entitySet: EntitySetV4 = {
      $: {
        Name: name,
        EntityType: entityType,
      },
    };
    this.addNavProps(entitySet, navProps);
    container.EntitySet.push(entitySet);

    return this;
  }

  public addSingleton(name: string, type: string, navProps: NavProps = []) {
    const container = this.getEntityContainer();
    if (!container.Singleton) {
      container.Singleton = [];
    }

    const singleton: Singleton = {
      $: {
        Name: name,
        Type: type,
      },
    };
    this.addNavProps(singleton, navProps);
    container.Singleton.push(singleton);

    return this;
  }

  public addFunctionImport(name: string, func: string, entitySet: string) {
    const container = this.getEntityContainer();
    if (!container.FunctionImport) {
      container.FunctionImport = [];
    }

    container.FunctionImport.push({
      $: {
        Name: name,
        Function: func,
        EntitySet: entitySet,
      },
    });

    return this;
  }

  public addActionImport(name: string, action: string) {
    const container = this.getEntityContainer();
    if (!container.ActionImport) {
      container.ActionImport = [];
    }

    container.ActionImport.push({
      $: {
        Name: name,
        Action: action,
      },
    });

    return this;
  }

  public addEntityType(
    name: string,
    baseType: string | undefined,
    builderFn: (builder: ODataEntityTypeBuilderV4) => void
  ) {
    if (!this.schema.EntityType) {
      this.schema.EntityType = [];
    }

    const builder = new ODataEntityTypeBuilderV4(name, baseType);
    builderFn(builder);
    this.schema.EntityType.push(builder.getEntityType());

    return this;
  }

  public addComplexType(
    name: string,
    baseType: string | undefined,
    builderFn: (builder: ODataComplexTypeBuilderV4) => void
  ) {
    if (!this.schema.ComplexType) {
      this.schema.ComplexType = [];
    }

    const builder = new ODataComplexTypeBuilderV4(name, baseType);
    builderFn(builder);
    this.schema.ComplexType.push(builder.getComplexType());

    return this;
  }

  public addFunction(
    name: string,
    returnType: string,
    isBound?: boolean,
    paramBuilder?: (builder: ODataOperationBuilderV4) => void
  ) {
    if (!this.schema.Function) {
      this.schema.Function = [];
    }

    const builder = new ODataOperationBuilderV4(name, returnType, isBound);
    if (paramBuilder) {
      paramBuilder(builder);
    }
    this.schema.Function.push(builder.getOperation());

    return this;
  }

  public addAction(
    name: string,
    returnType?: string,
    isBound?: boolean,
    paramBuilder?: (builder: ODataOperationBuilderV4) => void
  ) {
    if (!this.schema.Action) {
      this.schema.Action = [];
    }

    const builder = new ODataOperationBuilderV4(name, returnType, isBound);
    if (paramBuilder) {
      paramBuilder(builder);
    }
    this.schema.Action.push(builder.getOperation());

    return this;
  }
}
