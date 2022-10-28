import { ODataVersions } from "@odata2ts/odata-core";
import deepmerge from "deepmerge";
import { Project, SourceFile } from "ts-morph";

import { ConfigFileOptions, RunOptions, getDefaultConfig } from "../../../src";
import { DataModel } from "../../../src/data-model/DataModel";
import { Schema } from "../../../src/data-model/edmx/ODataEdmxModelBase";
import { DigesterFunction } from "../../../src/FactoryFunctionModel";
import { generateServices } from "../../../src/generator";
import { ProjectManager } from "../../../src/project/ProjectManager";
import { FixtureComparator, createFixtureComparator } from "./FixtureComparator";

export type EntityBasedGeneratorFunctionWithoutVersion = (
  dataModel: DataModel,
  sourceFile: SourceFile,
  options: RunOptions
) => void;

const project: Project = new Project({ skipAddingFilesFromTsConfig: true });

const DEFAULT_RUN_OPTIONS = deepmerge(getDefaultConfig(), {
  skipIdModels: true,
  skipEditableModels: true,
  skipOperations: false,
}) as RunOptions;

export const createHelper = async (
  fixtureBasePath: string,
  digest: DigesterFunction<any>,
  generate: EntityBasedGeneratorFunctionWithoutVersion
) => {
  const comparator = await createFixtureComparator(fixtureBasePath);
  return new FixtureComparatorHelper(comparator, digest, generate);
};

export class FixtureComparatorHelper {
  constructor(
    private comparator: FixtureComparator,
    private digest: DigesterFunction<any>,
    private generate: EntityBasedGeneratorFunctionWithoutVersion
  ) {}

  public async generateAndCompare(
    id: string,
    fixturePath: string,
    schema: Schema<any, any>,
    options?: ConfigFileOptions
  ) {
    const sourceFile = project.createSourceFile(id);
    const mergedOpts = options ? (deepmerge(DEFAULT_RUN_OPTIONS, options) as RunOptions) : DEFAULT_RUN_OPTIONS;
    const dataModel = await this.digest(schema, mergedOpts);

    this.generate(dataModel, sourceFile, mergedOpts);

    const result = sourceFile.getFullText().trim();
    await this.comparator.compareWithFixture(result, fixturePath);
  }
}

export const createServiceHelper = async (
  fixtureBasePath: string,
  digest: DigesterFunction<any>,
  version: ODataVersions
) => {
  const comparator = await createFixtureComparator(fixtureBasePath);
  return new ServiceFixtureComparatorHelper(comparator, digest, version);
};

export class ServiceFixtureComparatorHelper {
  constructor(
    private comparator: FixtureComparator,
    private digest: DigesterFunction<any>,
    private version: ODataVersions
  ) {}

  public async generateService(
    schema: Schema<any, any>,
    project: ProjectManager,
    runOptions: RunOptions = DEFAULT_RUN_OPTIONS
  ) {
    const dataModel = await this.digest(schema, runOptions);

    await generateServices(dataModel, project, this.version);
  }

  public async compareService(fixturePath: string, service: SourceFile) {
    const result = service.getFullText().trim();
    await this.comparator.compareWithFixture(result, fixturePath);
  }
}
