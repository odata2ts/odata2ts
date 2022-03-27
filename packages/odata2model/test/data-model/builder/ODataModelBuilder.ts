import {
  EntitySet,
  NavigationPropertyBinding,
  ODataEdmxModel,
  Schema,
  Singleton,
  Function,
} from "../../../src/data-model/edmx/ODataEdmxModel";
import { ODataComplexTypeBuilder } from "./ODataComplexTypeBuilder";
import { ODataEntityTypeBuilder } from "./ODataEntityTypeBuilder";
import { ODataFunctionBuilder } from "./ODataFunctionBuilder";

export enum ODataVersion {
  V4 = "4.0",
}

export interface NavProp {
  path: string;
  target: string;
}
export type NavProps = Array<NavProp>;
export interface NavPropsItem {
  NavigationPropertyBinding?: Array<NavigationPropertyBinding>;
}

export class ODataModelBuilder {
  private model: ODataEdmxModel;
  private schema: Schema;

  constructor(odataVersion: ODataVersion, serviceName: string) {
    this.schema = {
      $: {
        Namespace: serviceName,
        xmlns: "ignore",
      },
    };

    this.model = {
      "edmx:Edmx": {
        $: {
          Version: odataVersion,
          "xmlns:edmx": "ignore",
        },
        "edmx:DataServices": [
          {
            Schema: [this.schema],
          },
        ],
      },
    };
  }

  public getModel() {
    return this.model;
  }

  public getSchema() {
    return this.schema;
  }

  private getEntityContainer() {
    if (!this.schema.EntityContainer) {
      this.schema.EntityContainer = [
        {
          $: { Name: "ignore" },
        },
      ];
    }
    return this.schema.EntityContainer[0];
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

    const entitySet: EntitySet = {
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
    builderFn: (builder: ODataEntityTypeBuilder) => void
  ) {
    if (!this.schema.EntityType) {
      this.schema.EntityType = [];
    }

    const builder = new ODataEntityTypeBuilder(name, baseType);
    builderFn(builder);
    this.schema.EntityType.push(builder.getEntityType());

    return this;
  }

  public addComplexType(
    name: string,
    baseType: string | undefined,
    builderFn: (builder: ODataComplexTypeBuilder) => void
  ) {
    if (!this.schema.ComplexType) {
      this.schema.ComplexType = [];
    }

    const builder = new ODataComplexTypeBuilder(name, baseType);
    builderFn(builder);
    this.schema.ComplexType.push(builder.getComplexType());

    return this;
  }

  public addEnumType(name: string, values: Array<{ name: string; value: number }>) {
    if (!this.schema.EnumType) {
      this.schema.EnumType = [];
    }

    this.schema.EnumType.push({
      $: {
        Name: name,
      },
      Member: values.map((v) => ({
        $: {
          Name: v.name,
          Value: v.value,
        },
      })),
    });
  }

  public addFunction(
    name: string,
    returnType: string,
    isBound?: boolean,
    paramBuilder?: (builder: ODataFunctionBuilder) => void
  ) {
    if (!this.schema.Function) {
      this.schema.Function = [];
    }

    const builder = new ODataFunctionBuilder(name, returnType, isBound);
    if (paramBuilder) {
      paramBuilder(builder);
    }
    this.schema.Function.push(builder.getFunction() as Function);

    return this;
  }

  public addAction(
    name: string,
    returnType?: string,
    isBound?: boolean,
    paramBuilder?: (builder: ODataFunctionBuilder) => void
  ) {
    if (!this.schema.Action) {
      this.schema.Action = [];
    }

    const builder = new ODataFunctionBuilder(name, returnType, isBound);
    if (paramBuilder) {
      paramBuilder(builder);
    }
    this.schema.Action.push(builder.getFunction());

    return this;
  }
}
