import commander, { Option } from "commander";
import { cosmiconfig } from "cosmiconfig";
import { TypeScriptLoader } from "cosmiconfig-typescript-loader";
import { emptyDir, pathExists, readFile } from "fs-extra";
import { parseStringPromise } from "xml2js";

import { runApp } from "./app";
import { ODataEdmxModelBase } from "./data-model/edmx/ODataEdmxModelBase";
import { evaluateConfigOptions } from "./evaluateConfig";
import { CliOptions, ConfigFileOptions, EmitModes, Modes, RunOptions } from "./OptionModel";
import { logFilePath } from "./project/logger/logFilePath";

function parseMode(value: string, dummyPrevious: Modes | undefined) {
  switch (value) {
    case "models":
      return Modes.models;
    case "qobjects":
      return Modes.qobjects;
    case "service":
      return Modes.service;
    case "all":
      return Modes.all;
    default:
      return undefined;
  }
}

function parseEmitMode(value: string, dummyPrevious: EmitModes | undefined) {
  switch (value) {
    case "dts":
      return EmitModes.dts;
    case "js":
      return EmitModes.js;
    case "ts":
      return EmitModes.ts;
    case "js_dts":
      return EmitModes.js_dts;
    default:
      return undefined;
  }
}

function processCliArgs() {
  const cli = new commander.Command()
    .version("0.3.0")
    .description("CLI to generate Typescript Interfaces for models of a given OData service.")
    .option("-srv, --service [serviceNames...]", "Name the services as specified in config")
    .option("-s, --source <metadata.xml>", "Metadata file describing the OData service")
    .option("-o, --output <path>", "Output location for generated files")
    .addOption(
      new Option("-m, --mode <mode>", "What kind of stuff gets generated")
        .choices(Object.values(Modes).filter((t): t is string => isNaN(Number(t))))
        .argParser<Modes | undefined>(parseMode)
    )
    .addOption(
      new Option(
        "-e, --emit-mode <mode>",
        "Output TS source files, compiled JS files with/wihthout generated d.ts files"
      )
        .choices(Object.values(EmitModes))
        .argParser<EmitModes | undefined>(parseEmitMode)
    )
    .option("-p, --prettier", "Format result with prettier")
    .option("-d, --debug", "Verbose debug infos")
    .option("-name, --service-name <serviceName>", "Give the service your own name")
    .parse(process.argv);

  return cli.opts() as CliOptions;
}

async function processConfigFile() {
  const moduleName = "odata2ts";
  const explorer = cosmiconfig(moduleName, {
    searchPlaces: [`${moduleName}.config.js`, `${moduleName}.config.ts`, `${moduleName}.config.cjs`],
    loaders: {
      ".ts": TypeScriptLoader(),
    },
  });
  const discoveredConfig = await explorer.search();

  if (discoveredConfig?.config) {
    console.log("Loaded config file: ", logFilePath(discoveredConfig.filepath));
  } else {
    console.log("No config file found.");
  }

  return discoveredConfig?.config as ConfigFileOptions;
}

export class Cli {
  async run(): Promise<void> {
    const cliOpts = processCliArgs();
    const fileOpts = await processConfigFile();

    const runs = evaluateConfigOptions(cliOpts, fileOpts);

    for (let run of runs) {
      await startServiceGenerationRun(run);
    }
  }
}

async function startServiceGenerationRun(options: RunOptions) {
  const { source, output, debug } = options;

  if (debug) {
    console.log("Resolved config:", options);
  }

  console.log("Reading file:", source);
  const exists = await pathExists(source);
  if (!exists) {
    console.error(`Input source [${source}] doesn't exist!`);
    process.exit(2);
  }

  // read metadata file and convert to JSON
  const metadataXml = await readFile(source);
  const metadataJson = (await parseStringPromise(metadataXml)) as ODataEdmxModelBase<any>;
  // TODO find out if "1.0" and "4.0" are really correct
  // TODO exit here if no version not suitable version was detected
  // console.log(`OData version detected: ${metadataJson["edmx:Edmx"].$.Version}`);

  // ensure that output directory exists
  try {
    await emptyDir(output);
  } catch (error) {
    console.error(`Output path [${output}] couldn't be created!`, error);
    process.exit(3);
  }

  // run the app
  try {
    await runApp(metadataJson, options);
  } catch (err: any) {
    console.error("Error while running the program", err);
    process.exit(99);
  }
}
