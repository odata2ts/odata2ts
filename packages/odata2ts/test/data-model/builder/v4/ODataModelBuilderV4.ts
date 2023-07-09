import { ODataVersions } from "@odata2ts/odata-core";

import {
  ComplexTypeV4,
  EntitySetV4,
  EntityTypeV4,
  NavigationPropertyBinding,
  ODataEdmxModelV4,
  SchemaV4,
  Singleton,
} from "../../../../src/data-model/edmx/ODataEdmxModelV4";
import { ODataModelBuilder } from "../ODataModelBuilder";
import { ODataComplexTypeBuilderV4 } from "./ODataComplexTypeBuilderV4";
import { ODataEntityTypeBuilderV4 } from "./ODataEntityTypeBuilderV4";
import { ODataOperationBuilderV4 } from "./ODataOperationBuilderV4";

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
    super(serviceName, ODataVersions.V4);
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
    if (!this.currentSchema.EntityType) {
      this.currentSchema.EntityType = [];
    }

    const builder = new ODataEntityTypeBuilderV4(name, baseType);
    builderFn(builder);
    this.currentSchema.EntityType.push(builder.getEntityType());

    return this;
  }

  public addComplexType(
    name: string,
    baseType: string | undefined,
    builderFn: (builder: ODataComplexTypeBuilderV4) => void
  ) {
    if (!this.currentSchema.ComplexType) {
      this.currentSchema.ComplexType = [];
    }

    const builder = new ODataComplexTypeBuilderV4(name, baseType);
    builderFn(builder);
    this.currentSchema.ComplexType.push(builder.getComplexType());

    return this;
  }

  public addFunction(
    name: string,
    returnType: string,
    isBound?: boolean,
    paramBuilder?: (builder: ODataOperationBuilderV4) => void
  ) {
    if (!this.currentSchema.Function) {
      this.currentSchema.Function = [];
    }

    const builder = new ODataOperationBuilderV4(name, returnType, isBound);
    if (paramBuilder) {
      paramBuilder(builder);
    }
    this.currentSchema.Function.push(builder.getOperation());

    return this;
  }

  public addAction(
    name: string,
    returnType?: string,
    isBound?: boolean,
    paramBuilder?: (builder: ODataOperationBuilderV4) => void
  ) {
    if (!this.currentSchema.Action) {
      this.currentSchema.Action = [];
    }

    const builder = new ODataOperationBuilderV4(name, returnType, isBound);
    if (paramBuilder) {
      paramBuilder(builder);
    }
    this.currentSchema.Action.push(builder.getOperation());

    return this;
  }
}
