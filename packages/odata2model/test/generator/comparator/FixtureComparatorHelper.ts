import { Project, SourceFile } from "ts-morph";

import { RunOptions } from "../../../lib/OptionModel";
import { ODataVesions } from "../../../src/app";
import { Schema } from "../../../src/data-model/edmx/ODataEdmxModelBase";
import { DigesterFunction, EntityBasedGeneratorFunction } from "../../../src/FactoryFunctionModel";
import { generateServices } from "../../../src/generator";
import { EmitModes, Modes } from "../../../src/OptionModel";
import { ProjectManager } from "../../../src/project/ProjectManager";
import { FixtureComparator, createFixtureComparator } from "./FixtureComparator";

const project: Project = new Project({ skipAddingFilesFromTsConfig: true });

const DEFAULT_RUN_OPTIONS = {
  mode: Modes.all,
  emitMode: EmitModes.js_dts,
  output: "ignore",
  prettier: false,
  debug: false,
  modelPrefix: "",
  modelSuffix: "",
};

export const createHelper = async (
  fixtureBasePath: string,
  digest: DigesterFunction<any>,
  generate: EntityBasedGeneratorFunction
) => {
  const comparator = await createFixtureComparator(fixtureBasePath);
  return new FixtureComparatorHelper(comparator, digest, generate);
};

export class FixtureComparatorHelper {
  constructor(
    private comparator: FixtureComparator,
    private digest: DigesterFunction<any>,
    private generate: EntityBasedGeneratorFunction
  ) {}

  public async generateAndCompare(
    id: string,
    fixturePath: string,
    schema: Schema<any, any>,
    runOptions: RunOptions = DEFAULT_RUN_OPTIONS
  ) {
    const sourceFile = project.createSourceFile(id);
    const dataModel = await this.digest(schema, runOptions);

    this.generate(dataModel, sourceFile);

    const result = sourceFile.getFullText().trim();
    await this.comparator.compareWithFixture(result, fixturePath);
  }
}

export const createServiceHelper = async (
  fixtureBasePath: string,
  digest: DigesterFunction<any>,
  version: ODataVesions
) => {
  const comparator = await createFixtureComparator(fixtureBasePath);
  return new ServiceFixtureComparatorHelper(comparator, digest, version);
};

export class ServiceFixtureComparatorHelper {
  constructor(
    private comparator: FixtureComparator,
    private digest: DigesterFunction<any>,
    private version: ODataVesions
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
