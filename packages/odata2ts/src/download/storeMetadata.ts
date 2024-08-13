import { writeFile } from "fs/promises";
import path from "path";

// @ts-ignore
import { ensureDir } from "fs-extra/esm";
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
    ? await prettier.format(
        metadataXml,
        // @ts-ignore: xmlWhitespaceSensitivity is an option of the plugin
        { ...prettierConfig, parser: "xml", plugins: ["@prettier/plugin-xml"] },
      )
    : metadataXml;

  await ensureDir(outDir);
  await writeFile(filePath, prettified);

  return prettified;
}
