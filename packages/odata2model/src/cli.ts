import { ensureDir, pathExists, readFile } from "fs-extra";
import commander, { Option } from "commander";
import { cosmiconfig } from "cosmiconfig";
import { parseStringPromise } from "xml2js";

import { runApp } from "./app";
import { EmitModes, Modes, ProjectOptions, RunOptions } from "./OptionModel";
import { ODataEdmxModel } from "./data-model/edmx/ODataEdmxModel";
import { logFilePath } from "./project/logger/logFilePath";

export class Cli {
  async run(): Promise<void> {
    const cli = new commander.Command()
      .version("0.2.0")
      .description("CLI to generate Typescript Interfaces for models of a given OData service.")
      .requiredOption("-s, --source <metadata.xml>", "Metadata file describing the OData service")
      .requiredOption("-o, --output <path>", "Output location for generated files")
      .addOption(
        new Option("-m, --mode <mode>", "What kind of stuff gets generated").choices([
          "models",
          "qobjects",
          "service",
          "all",
        ])
      )
      .addOption(
        new Option(
          "-e, --emit-mode <mode>",
          "Output TS source files, compiled JS files with/wihthout generated d.ts files"
        ).choices(Object.values(EmitModes))
      )
      .option("-prefix, --model-prefix <prefix>", "Prefix the generated interfaces with a static string")
      .option("-suffix, --model-suffix <suffix>", "Suffix the generated interfaces with a static string")
      .option("-p, --prettier", "Format result with prettier")
      .option("-d, --debug", "Verbose debug infos")
      .parse(process.argv);

    const defaultConfig = {
      mode: "all",
      emitMode: "js-dts",
      modelPrefix: "",
      modelSuffix: "",
      prettier: false,
      debug: false,
    };
    const cliOpts = cli.opts() as Partial<ProjectOptions>;
    const explorer = cosmiconfig("odata2ts");
    const discoveredConfig = await explorer.search();

    if (discoveredConfig?.config) {
      console.log("Loaded config file: ", discoveredConfig.filepath);
    } else {
      console.log("No config file found");
    }

    const mergedConfig = {
      ...defaultConfig,
      ...(discoveredConfig?.config || {}),
      ...cliOpts,
    };

    const { source, emitMode, mode, ...opts } = mergedConfig;
    const options: RunOptions = {
      mode: Modes[mode],
      emitMode: emitMode as EmitModes,
      ...opts,
    };

    if (options.debug) {
      console.log("Resolved config:", {
        mode,
        emitMode,
        ...opts,
      });
    }

    console.log("Reading file:", source);
    const exists = await pathExists(source);
    if (!exists) {
      console.error(`Input source [${source}] doesn't exist!`);
      process.exit(2);
    }

    // read metadata file and convert to JSON
    const metadataXml = await readFile(source);
    const metadataJson = (await parseStringPromise(metadataXml)) as ODataEdmxModel;

    // ensure that output directory exists
    try {
      await ensureDir(options.output);
    } catch (error) {
      console.error(`Output path [${options.output}] couldn't be created!`, error);
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
}
