import { readFileSync } from "fs-extra";
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
    const base = basePath ? basePath.replace(/\/$/, "") : "";
    this.path = `test/fixture${base ? "/" + base : ""}/`;
  }

  public async compareWithFixture(text: string, fixturePath: string) {
    const config = this.prettierConfig || undefined;
    const result = prettier.format(text, config);
    const fixture = await this.loadFixture(this.path + fixturePath);
    const cleanedFixture = fixture.replace(new RegExp("^//( )*@ts-nocheck"), "").trim();

    expect(result.trim()).toBe(cleanedFixture);
  }

  public async loadFixture(path: string) {
    return readFileSync(path, "utf-8");
  }
}
