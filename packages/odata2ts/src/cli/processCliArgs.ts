import { Command, Option } from "commander";

import { CliOptions, EmitModes, Modes } from "../OptionModel.js";

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
      throw new Error(`Not a valid Mode: ${value}`);
  }
}

function parseEmitMode(value: string, dummyPrevious: EmitModes) {
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
      throw new Error(`Not a valid EmitMode: ${value}`);
  }
}

export function processCliArgs(argv: Array<string>) {
  const cli = new Command()
    .version("0.3.0")
    .description("CLI to generate Typescript Interfaces for models of a given OData service.")
    .argument("[services...]", "Run the generation process only for certain services specified in config file", [])
    .option("-s, --source <url or metadata.xml>", "Path to metadata file")
    .option("-o, --output <path>", "Output location for generated files")
    .option("-u, --source-url <sourceUrl>", "URL to the root of the OData service")
    .option(
      "-f, --refresh-file",
      "Download metadata again and overwrite existing file (only applies if sourceUrl is specified)"
    )
    .addOption(
      new Option("-m, --mode <mode>", "What kind of stuff gets generated")
        .choices(Object.values(Modes).filter((t): t is string => isNaN(Number(t))))
        .argParser<Modes>(parseMode)
    )
    .addOption(
      new Option(
        "-e, --emit-mode <mode>",
        "Output TS source files, compiled JS files with/wihthout generated d.ts files"
      )
        .choices(Object.values(EmitModes))
        .argParser<EmitModes>(parseEmitMode)
    )
    .option("-p, --prettier", "Format result with prettier (only applies if emitMode=ts)")
    .option(
      "-t, --tsconfig <path>",
      "Specify alternative to 'tsconfig.json' to use specific compilerOptions (applies if emitMode is not ts)"
    )
    .option("-d, --debug", "Verbose debug infos")
    .option("-name, --service-name <serviceName>", "Give the service your own name")
    .option(
      "-n, --disable-auto-managed-key",
      "Don't mark single key props as managed by the server side (not editable)"
    )
    .option("-r, --allow-renaming", "Allow that property and entity names may be changed by configured casing")
    .parse(argv);

  const args = cli.args?.length ? { services: cli.args } : {};
  return {
    ...cli.opts(),
    ...args,
  } as CliOptions;
}
