import { ODataVersions } from "@odata2ts/odata-core";
import { MethodSignatureStructure, OptionalKind } from "ts-morph";

import { DataModel } from "../../data-model/DataModel";
import { NamingHelper } from "../../data-model/NamingHelper";
import { FileHandler } from "../../project/FileHandler";
import { ClientApiImports } from "../import/ImportObjects";
import { ServiceGeneratorOptions } from "../ServiceGenerator";
import { ApiInterfaceHandler } from "./ApiInterfaceHandler";

export class ServiceApiGenerator {
  constructor(
    private serviceApiFile: FileHandler,
    private dataModel: DataModel,
    private version: ODataVersions,
    private namingHelper: NamingHelper,
    private options: ServiceGeneratorOptions = {}
  ) {}

  public getMainServiceApiName(): string {
    return this.namingHelper.getServiceApiName(this.namingHelper.getODataServiceName());
  }

  private addClientType() {
    const imports = this.serviceApiFile.getImports();
    const [httpClient] = imports.addClientApi(ClientApiImports.ODataHttpClient);

    return `ClientType extends ${httpClient}`;
  }

  public createMainInterfaceHandler() {
    const apiName = this.getMainServiceApiName();
    const handler = this.createInterfaceHandler(apiName, true);

    handler.addMethod({
      name: "getPath",
      returnType: "string",
    });

    return handler;
  }

  public createInterfaceHandler(name: string, withClientType: boolean = false): ApiInterfaceHandler {
    const handler = new ApiInterfaceHandler(name, this.serviceApiFile.getImports(), this.namingHelper, this.version);
    if (withClientType) {
      handler.setTypeParameter(this.addClientType());
    }
    return handler;
  }

  public finalizeInterface(apiHandler: ApiInterfaceHandler) {
    const structure = apiHandler.buildInterface();
    this.serviceApiFile.getFile().addInterface(structure);

    return structure.name;
  }
}
