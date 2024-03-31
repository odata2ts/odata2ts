import { ODataVersions } from "@odata2ts/odata-core";
import { SourceFile } from "ts-morph";

import { Schema } from "../../../src/data-model/edmx/ODataEdmxModelBase";
import { NamingHelper } from "../../../src/data-model/NamingHelper";
import { DigesterFunction } from "../../../src/FactoryFunctionModel";
import { generateServices } from "../../../src/generator";
import { ServiceGeneratorOptions } from "../../../src/generator/ServiceGenerator";
import { ProjectManager } from "../../../src/project/ProjectManager";
import { DEFAULT_RUN_OPTIONS } from "./DefaultOptions";
import { FixtureComparator } from "./FixtureComparator";

export class ServiceFixtureComparatorHelper {
  constructor(
    private comparator: FixtureComparator,
    private digest: DigesterFunction<any>,
    private version: ODataVersions
  ) {}

  public async createDataModel(
    schemas: Array<Schema<any, any>>,
    namingHelper: NamingHelper,
    options?: ServiceGeneratorOptions
  ) {
    return this.digest(schemas, { ...DEFAULT_RUN_OPTIONS, ...options }, namingHelper);
  }

  public async generateService(project: ProjectManager, namingHelper: NamingHelper, options?: ServiceGeneratorOptions) {
    await generateServices(project, project.getDataModel(), this.version, namingHelper, options);
  }

  public async compareService(fixturePath: string, service: SourceFile) {
    const result = service.getFullText().trim();
    await this.comparator.compareWithFixture(result, fixturePath);
  }
}
