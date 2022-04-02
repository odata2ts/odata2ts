import type { FileFormatter } from "./FileFormatter";
import { PrettierFormatter } from "./PrettierFormatter";
import { NoopFormatter } from "./NoopFormatter";

export async function createFormatter(outputDir: string, usePrettier: boolean): Promise<FileFormatter> {
  const formatter = usePrettier ? new PrettierFormatter(outputDir) : new NoopFormatter(outputDir);
  await formatter.init();

  return formatter;
}
