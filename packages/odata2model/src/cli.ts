import commander from "commander";
import { App } from "./app";

export interface Odata2tsOptions {
  source: string;
  output: string;
  prettier: boolean;
  debug: boolean;
}

function main(): void {
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

  new App().run(source, output, options).catch((err: Error) => {
    console.error("Error while running the program", err);
    process.exit(1);
  });
}

main();
