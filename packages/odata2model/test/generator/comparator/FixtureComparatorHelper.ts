import { ODataVersions } from "@odata2ts/odata-core";
import { Project, SourceFile } from "ts-morph";

import { DataModel } from "../../../src/data-model/DataModel";
import { Schema } from "../../../src/data-model/edmx/ODataEdmxModelBase";
import { DigesterFunction } from "../../../src/FactoryFunctionModel";
import { generateServices } from "../../../src/generator";
import { GenerationOptions, RunOptions } from "../../../src/OptionModel";
import { EmitModes, Modes } from "../../../src/OptionModel";
import { ProjectManager } from "../../../src/project/ProjectManager";
import { FixtureComparator, createFixtureComparator } from "./FixtureComparator";

export type EntityBasedGeneratorFunctionWithoutVersion = (
  dataModel: DataModel,
  sourceFile: SourceFile,
  options: GenerationOptions
) => void;

const project: Project = new Project({ skipAddingFilesFromTsConfig: true });

const DEFAULT_RUN_OPTIONS: RunOptions = {
  mode: Modes.all,
  emitMode: EmitModes.js_dts,
  output: "ignore",
  prettier: false,
  debug: false,
  modelPrefix: "",
  modelSuffix: "",
  generation: {
    skipIdModel: true,
    skipEditableModel: true,
    skipOperationModel: false,
  },
};

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
    options?: GenerationOptions
  ) {
    const sourceFile = project.createSourceFile(id);
    const dataModel = await this.digest(schema, DEFAULT_RUN_OPTIONS);

    const genOptions: GenerationOptions | undefined = options
      ? { ...DEFAULT_RUN_OPTIONS.generation, ...options }
      : DEFAULT_RUN_OPTIONS.generation;
    this.generate(dataModel, sourceFile, genOptions || {});

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
