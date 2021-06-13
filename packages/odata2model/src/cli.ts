import commander from "commander";

export interface Odata2tsOptions {
  source: string;
  output: string;
  debug: boolean;
}

function main(): void {
  const cli = new commander.Command()
    .version("0.1.0")
    .description("CLI to generate Typescript Interfaces for models of a given OData service.")
    .requiredOption("-s, --source <metadata.xml>", "Metadata file describing the OData service")
    .requiredOption("-o, --output <path>", "Output location for generated files")
    .option("-d, --debug", "Verbose debug infos", false)
    .parse(process.argv);

  const { source, output, ...options } = cli.opts() as Odata2tsOptions;

  if (options.debug) {
    console.log("Provided Options:", cli.opts());
  }
}

main();
