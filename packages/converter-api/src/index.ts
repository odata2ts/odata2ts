/**
 * Specifies the format of the default export of a valid converter package.
 */
export interface ConverterPackage {
  /**
   * Unique name of the converter package.
   *
   * Only needed for debug purposes right now.
   */
  id: string;
  /**
   * List of converters offered by this package.
   */
  converters: Array<ValueConverterType>;
}

/**
 * Required meta information for any ValueConverter
 */
export interface ValueConverterType {
  /**
   * Must exactly match the ValueConverter name as it is exported from the package.
   * E.g. id = "timeToDuration" would result in trying to load the given converter by calling
   * import { timeToDurationConverter } from "@odata2ts/converter-v2-to-v4"
   */
  id: string;
  /**
   * The type or types which will be used as input for this converter.
   */
  from: string | Array<string>;
  /**
   * The output type of this converter.
   */
  to: string;
}

export interface ValueConverter<OriginalType, ConvertedType> extends ValueConverterType {
  /**
   * Converts from the source value type to the user facing type.
   * @param value source value
   */
  convertFrom(value: ParamValueModel<OriginalType>): ParamValueModel<ConvertedType>;

  /**
   * Converts from use facing type to the source value type.
   * @param value user facing value
   */
  convertTo(value: ParamValueModel<ConvertedType>): ParamValueModel<OriginalType>;
}

/**
 * Represents a parameter value, which can always be null or undefined.
 *
 * Undefined is used as return value when a conversion failed.
 */
export type ParamValueModel<Type> = Type | null | undefined;

/**
 * Noop converter.
 */
export interface IdentityConverter<OriginalType, ConvertedType> extends ValueConverter<OriginalType, ConvertedType> {}

export interface ChainableValueConverter<OriginalType, ConvertedType>
  extends ValueConverter<OriginalType, ConvertedType> {
  chain<T>(converterToChain: ValueConverter<ConvertedType, T>): ChainableValueConverter<OriginalType, T>;
}
