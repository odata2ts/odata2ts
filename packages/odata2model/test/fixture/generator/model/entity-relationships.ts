export interface Book {
  id: string;
  branding?: Brand;
  multipleBrands?: Array<Brand>;
  multipleStrings?: Array<string>;
  multipleNumbers?: Array<number>;
}

export interface Brand {
  color?: string;
}
