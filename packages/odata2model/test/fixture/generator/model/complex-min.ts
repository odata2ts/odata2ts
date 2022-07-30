export interface Brand {
  naming: boolean | null;
}

export interface EditableBrand extends Partial<Pick<Brand, "naming">> {}
