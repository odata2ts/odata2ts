export interface Brand {
  naming: boolean | null;
  complex: Test | null;
}

export interface EditableBrand extends Partial<Pick<Brand, "naming">> {
  complex?: EditableTest | null;
}

export interface Test {
  test: boolean | null;
}

export interface EditableTest extends Partial<Pick<Test, "test">> {}
