import { Odata2tsOptions } from "./cli";
import { NoopFormatter } from "./formatter/NoopFormatter";
import { PrettierFormatter } from "./formatter/PrettierFormatter";

export interface RunOptions extends Omit<Odata2tsOptions, "source" | "output"> {}

export class App {
  /**
   *
   * @param odataMetadataJson metadata of a given OData service already parsed as JSON
   * @param outputPath path to the target folder
   * @param options further options
   */
  public async run(odataMetadataJson: string, outputPath: string, options: RunOptions): Promise<void> {
    const odata = odataMetadataJson;

    const formatter = await this.createFormatter(outputPath, options.prettier);

    const text = "const  test =  'Hi'";
    const formatted = await formatter.format(text);
    console.log(`Result [formatted: ${options.prettier}]`, formatted);
  }

  public async createFormatter(outputPath: string, isEnabled: boolean) {
    const formatter = isEnabled ? new PrettierFormatter(outputPath) : new NoopFormatter(outputPath);
    return await formatter.init();
  }
}
