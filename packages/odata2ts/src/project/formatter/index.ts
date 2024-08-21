import type { FileFormatter } from "./FileFormatter.js";
import { NoopFormatter } from "./NoopFormatter.js";
import { PrettierFormatter } from "./PrettierFormatter.js";

export async function createFormatter(outputDir: string, usePrettier: boolean): Promise<FileFormatter> {
  const formatter = usePrettier ? new PrettierFormatter(outputDir) : new NoopFormatter(outputDir);
  await formatter.init();

  return formatter;
}
