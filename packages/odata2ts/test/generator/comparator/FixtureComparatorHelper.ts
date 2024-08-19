import { ODataVersions } from "@odata2ts/odata-core";
import deepmerge from "deepmerge";
import { Project, SourceFile } from "ts-morph";

import { RunOptions } from "../../../src";
import { DataModel } from "../../../src/data-model/DataModel";
import { Schema } from "../../../src/data-model/edmx/ODataEdmxModelBase";
import { NamingHelper } from "../../../src/data-model/NamingHelper";
import { DigesterFunction } from "../../../src/FactoryFunctionModel";
import { ProjectManager } from "../../../src/project/ProjectManager";
import { TestOptions, TestSettings } from "../TestTypes";
import { DEFAULT_MIN_OPTIONS, DEFAULT_RUN_OPTIONS } from "./DefaultOptions";
import { FixtureComparator, createFixtureComparator } from "./FixtureComparator";
import { ServiceFixtureComparatorHelper } from "./ServiceFixtureComparatorHelper";

export type EntityBasedGeneratorFunctionWithoutVersion = (
  dataModel: DataModel,
  options: TestSettings,
  namingHelper: NamingHelper
) => Promise<ProjectManager>;

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
    const defaultOpts: TestSettings = options?.naming?.minimalDefaults ? DEFAULT_MIN_OPTIONS : DEFAULT_RUN_OPTIONS;
    const mergedOpts: TestSettings = options ? (deepmerge(defaultOpts, options) as RunOptions) : defaultOpts;
    const namingHelper = new NamingHelper(mergedOpts, mergedOpts.serviceName || schemas[0].$.Namespace);
    const dataModel = await this.digest(schemas, mergedOpts, namingHelper);

    const pm = await this.generate(dataModel, mergedOpts, namingHelper);
    const file = pm.getCachedFiles().get(id);
    if (!file) {
      const cachedFileNames = [...pm.getCachedFiles().keys()].join(", ");
      throw new Error(`File "${id}" has not been generated! Generated files: ${cachedFileNames}`);
    }
    const result = file.getFullText().trim();
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
