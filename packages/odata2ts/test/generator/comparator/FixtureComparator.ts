import path from "path";
import { pathExistsSync, readFileSync } from "fs-extra";
import prettier, { Options } from "prettier";

/**
 * Create a new fixture comparator for a whole test suite.
 *
 * Fixtures are always loaded from folder "test/fixture". Per test suite a new sub folder should be used.
 *
 * @param basePath base path for this test suite, appended to "test/fixture".
 */
export async function createFixtureComparator(basePath: string) {
  const prettierOptions = await prettier.resolveConfig("");
  return new FixtureComparator(basePath, {
    ...prettierOptions,
    parser: "typescript",
  });
}

export class FixtureComparator {
  private readonly path: string;

  constructor(basePath: string, private prettierConfig: Options | null) {
    this.path = path.join(__dirname, "../../fixture", basePath);
  }

  public async compareWithFixture(text: string, fixturePath: string) {
    const config = this.prettierConfig || undefined;
    const result = prettier.format(text, config);

    const fullPath = this.path + path.sep + fixturePath;
    if (!pathExistsSync(fullPath)) {
      throw new Error("Unable to load fixture: " + fullPath);
    }

    const fixture = this.loadFixture(fullPath);
    const cleanedFixture = fixture
      .replace(/\r\n/g, "\n")
      .replace(new RegExp("^//( )*@ts-nocheck( )*\n"), "")
      .replace(/[ ]*\/\/[ ]*@ts-ignore[ ]*\n/g, "")
      .trim();
    expect(result.trim()).toEqual(cleanedFixture);
  }

  public loadFixture(path: string) {
    return readFileSync(path, "utf-8");
  }
}
