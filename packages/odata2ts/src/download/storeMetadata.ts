import path from "path";

import { ensureDir, writeFile } from "fs-extra";
import prettier from "prettier";

/**
 * Write (prettified) data to disk.
 *
 * @param filePath
 * @param metadataXml
 * @param prettify
 */
export async function storeMetadata(filePath: string, metadataXml: string, prettify: boolean) {
  const outDir = path.dirname(filePath);

  const prettierConfig = await prettier.resolveConfig(outDir);
  const prettified = prettify
    ? prettier.format(
        metadataXml,
        // @ts-ignore: xmlWhitespaceSensitivity is an option of the plugin
        { xmlWhitespaceSensitivity: "ignore", ...prettierConfig, parser: "xml", plugins: ["@prettier/plugin-xml"] }
      )
    : metadataXml;

  await ensureDir(outDir);
  await writeFile(filePath, prettified);

  return prettified;
}
