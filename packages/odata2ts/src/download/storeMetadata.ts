import { writeFile } from "node:fs/promises";
import path from "node:path";
import { mkdirp } from "mkdirp";
import { format, resolveConfig } from "prettier";

/**
 * Write (prettified) data to disk.
 *
 * @param filePath
 * @param metadataXml
 * @param prettify
 */
export async function storeMetadata(filePath: string, metadataXml: string, prettify: boolean) {
  const outDir = path.dirname(filePath);

  let prettified = metadataXml;
  if (prettify) {
    // the file rather than its directory: prettier matches `overrides` against the path it is given,
    // and the options for XML - xmlWhitespaceSensitivity above all - only ever live in such an override
    const prettierConfig = await resolveConfig(filePath);
    prettified = await format(
      metadataXml,
      // @ts-ignore: xmlWhitespaceSensitivity is an option of the plugin
      { ...prettierConfig, parser: "xml", plugins: ["@prettier/plugin-xml"] },
    );
  }

  await mkdirp(outDir);
  await writeFile(filePath, prettified);

  return prettified;
}
