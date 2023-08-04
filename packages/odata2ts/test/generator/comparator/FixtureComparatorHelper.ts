import { ODataVersions } from "@odata2ts/odata-core";
import deepmerge from "deepmerge";
import { Project, SourceFile } from "ts-morph";

import { RunOptions } from "../../../src";
import { DataModel } from "../../../src/data-model/DataModel";
import { Schema } from "../../../src/data-model/edmx/ODataEdmxModelBase";
import { NamingHelper } from "../../../src/data-model/NamingHelper";
import { DigesterFunction } from "../../../src/FactoryFunctionModel";
import { generateServices } from "../../../src/generator";
import { ServiceGeneratorOptions } from "../../../src/generator/ServiceGenerator";
import { ProjectManager } from "../../../src/project/ProjectManager";
import { getTestConfig, getTestConfigMinimal } from "../../test.config";
import { TestOptions, TestSettings } from "../TestTypes";
import { FixtureComparator, createFixtureComparator } from "./FixtureComparator";

export type EntityBasedGeneratorFunctionWithoutVersion = (
  dataModel: DataModel,
  sourceFile: SourceFile,
  options: TestSettings,
  namingHelper: NamingHelper
) => void;

const project: Project = new Project({ skipAddingFilesFromTsConfig: true });

const DEFAULT_COMPARE_OPTS: TestOptions = {
  skipIdModels: true,
  skipEditableModels: true,
  skipOperations: false,
  skipComments: true,
};

const DEFAULT_RUN_OPTIONS = {
  ...getTestConfig(),
  ...DEFAULT_COMPARE_OPTS,
} as TestSettings;

const DEFAULT_MIN_OPTIONS = {
  ...getTestConfigMinimal(),
  ...DEFAULT_COMPARE_OPTS,
} as TestSettings;

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
    schemas: Array<Schema<any, any>>,
    options?: TestOptions
  ) {
    const sourceFile = project.createSourceFile(id);
    const defaultOpts: TestSettings = options?.naming?.minimalDefaults ? DEFAULT_MIN_OPTIONS : DEFAULT_RUN_OPTIONS;
    const mergedOpts: TestSettings = options ? (deepmerge(defaultOpts, options) as RunOptions) : defaultOpts;
    const namingHelper = new NamingHelper(mergedOpts, mergedOpts.serviceName || schemas[0].$.Namespace);
    const dataModel = await this.digest(schemas, mergedOpts, namingHelper);

    this.generate(dataModel, sourceFile, mergedOpts, namingHelper);

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
    schemas: Array<Schema<any, any>>,
    project: ProjectManager,
    namingHelper: NamingHelper,
    options?: ServiceGeneratorOptions
  ) {
    const dataModel = await this.digest(schemas, { ...DEFAULT_RUN_OPTIONS, ...options }, namingHelper);

    await generateServices(dataModel, project, this.version, namingHelper, options);
  }

  public async compareService(fixturePath: string, service: SourceFile) {
    const result = service.getFullText().trim();
    await this.comparator.compareWithFixture(result, fixturePath);
  }
}
