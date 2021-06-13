import commander from "commander";
import { ensureDir, pathExists, readFile } from "fs-extra";
import * as path from "path";
import { parseStringPromise } from "xml2js";

import { App } from "./app";

export interface Odata2tsOptions {
  source: string;
  output: string;
  prettier: boolean;
  debug: boolean;
}

class Cli {
  public async main(): Promise<void> {
    const cli = new commander.Command()
      .version("0.1.0")
      .description("CLI to generate Typescript Interfaces for models of a given OData service.")
      .requiredOption("-s, --source <metadata.xml>", "Metadata file describing the OData service")
      .requiredOption("-o, --output <path>", "Output location for generated files")
      .option("-p, --prettier", "Format result with prettier", false)
      .option("-d, --debug", "Verbose debug infos", false)
      .parse(process.argv);

    const { source, output, ...options } = cli.opts() as Odata2tsOptions;

    if (options.debug) {
      console.log("Provided Options:", cli.opts());
    }

    console.log("Reading file:", source);
    const exists = await pathExists(source);
    if (!exists) {
      console.error(`Input source [${source}] doesn't exist!`);
      process.exit(1);
    }

    // read metadata file and convert to JSON
    const metadataXml = await readFile(source);
    const metadataJson = await parseStringPromise(metadataXml);

    // ensure that output directory exists
    await ensureDir(output).catch((error: Error) => {
      console.error(`Output path [${output}] couldn't be created!`, error);
    });

    // run the app
    new App().run(metadataJson, output, options).catch((err: Error) => {
      console.error("Error while running the program", err);
      process.exit(1);
    });
  }
}

new Cli().main();
