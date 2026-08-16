/**
 * Enumerates all possible V2 EDMX data types.
 *
 * In V2 values of data types are represented differently depending on where they are used.
 * We have to differentiate two types of usages:
 * - URL: entails filter values & function parameters (represented as query params)
 * - JSON: values in request or response bodies
 *
 * For URL usage, see chapter 6 "Primitive Data Types" of the V2 overview document
 * {@link https://www.odata.org/documentation/odata-version-2-0/overview/}. This is the most authoritative
 * resource despite it's lack of being a true specification.
 *
 * For JSON usage, use chapter 4 "Primitive Types" of the document about the JSON format
 * {@link https://www.odata.org/documentation/odata-version-2-0/json-format/}.
 */
export enum ODataTypesV2 {
  /**
   * Represents a boolean value.
   *
   * The URL representation is the literal value "true" or "false".
   *
   * The JSON representation is the boolean type.
   */
  Boolean = "Edm.Boolean",
  /**
   * Plain string value.
   *
   * The URL representation requires single quotes around the value, e.g "'test'".
   *
   * The JSON representation is a plain string.
   */
  String = "Edm.String",
  /**
   * Represents an unsigned 8-bit integer value.
   *
   * The URL representation is the literal number.
   * The JSON representation is string.
   */
  Byte = "Edm.Byte",
  /**
   * Represents a signed 8-bit integer value
   *
   * The URL representation is the literal number.
   * The JSON representation is string.
   */
  SByte = "Edm.SByte",
  /**
   * Represents a signed 16-bit integer value.
   *
   * The URL representation is the literal number.
   * The JSON representation is number.
   */
  Int16 = "Edm.Int16",
  /**
   * Represents a signed 32-bit integer value.
   *
   * The URL representation is the literal number.
   * The JSON representation is number.
   */
  Int32 = "Edm.Int32",
  /**
   * Represents a signed 64-bit integer value. Such values potentially exceed the capacity of the
   * JS number type.
   *
   * The URL representation is the literal number with the type suffix "L", e.g. "123L".
   * Although this type suffix is mandatory according to the spec, most services don't require it
   * when using those values in the filter. However, SAP technologies at least require those type
   * suffixes for function parameters.
   *
   * The JSON representation is string.
   */
  Int64 = "Edm.Int64",
  /**
   * Represents a floating point number with 7 digits precision.
   *
   * The URL representation is the literal number with type suffix "f", e.g. "1.2f".
   * Although this type suffix is mandatory according to the spec, most services don't require it
   * when using those values in the filter. However, SAP technologies at least require those type
   * suffixes for function parameters.
   *
   * The JSON representation is string.
   */
  Single = "Edm.Single",
  /**
   * Represents a floating point number with 15 digits precision.
   *
   * The URL representation is the literal number with type suffix "d", e.g. "1.2d".
   * Although this type suffix is mandatory according to the spec, most services don't require it
   * when using those values in the filter. However, SAP technologies at least require those type
   * suffixes for function parameters.
   *
   * The JSON representation is string.
   */
  Double = "Edm.Double",
  /**
   * Represents numeric values with arbitrary precision and scale. Such values potentially exceed
   * the capacity of the JS number type.
   *
   * The URL representation is the literal number with type suffix "M" or "m", e.g. "12.2M".
   * Although this type suffix is mandatory according to the spec, most services don't require it
   * when using those values in the filter. However, SAP technologies at least require those type
   * suffixes for function parameters.
   *
   * The JSON representation is string.
   */
  Decimal = "Edm.Decimal",
  /**
   * Represents a 16-byte (128-bit) unique identifier value.
   * Such a value is usually generated and stresses its uniqueness.
   *
   * The URL representation requires a type prefix, e.g. "guid'xxx...'".
   *
   * The JSON representation is a plain string value.
   */
  Guid = "Edm.Guid",
  /**
   * Actually Edm.Time is defined as day time duration (https://www.w3.org/TR/xmlschema11-2/#nt-duDTFrag).
   * The duration format is better explained here: ({@link https://en.wikipedia.org/wiki/ISO_8601#Durations}).
   *
   * It's probably meant to be only a time duration without the possibility to specify a day duration part.
   * So it should always start wit "PT" (P = duration; T = identifies beginning of time part):
   * - PT12H15M => 12 hours and 15 minutes
   * - PT5S => 5 seconds
   * - PT1H5.123S => 1 hour, 5 seconds and 123 milliseconds
   *
   * However, the V2 spec suggests to use Edm.Time to represent a specific time of the day:
   * "Represents the time of day with values ranging from 0:00:00.x to 23:59:59.y,
   * where x and y depend upon the precision"
   *
   * When representing the time of a day, then hours and minutes should always be specified (cf. V4's Edm.TimeOfDay).
   * Hence, only the first of the given examples would be valid.
   *
   * This data type is removed in V4 due to its ambiguity and probably wrong specification.
   * It has been replaced by Edm.TimeOfDay and Edm.Duration.
   */
  Time = "Edm.Time",
  /**
   * Represents a point in time.
   *
   * The URL representation makes use of ISO 8601 date time format
   * (https://en.wikipedia.org/wiki/ISO_8601#Combined_date_and_time_representations) but requires a special type prefix,
   * e.g. "datetime'2022-12-31T23:59:59'".
   *
   * The JSON representation (cf. chap 4, https://www.odata.org/documentation/odata-version-2-0/json-format/)
   * relies on a quite special syntax but essentially facilitates a time stamp, e.g. "/Date(1672531199000)/".
   * The format also allows for specifying an offset in minutes, e.g. "/Date(1672531199000+60)/".
   *
   * This data type has been removed with V4, thereby only leaving Edm.DateTimeOffset, which always relied on
   * ISO 8601 semantics.
   */
  DateTime = "Edm.DateTime",
  /**
   * Represents a point in time.
   *
   * The URL representation makes use of ISO 8601 date time format
   * (https://en.wikipedia.org/wiki/ISO_8601#Combined_date_and_time_representations) but requires a special type prefix,
   * e.g. "datetimeoffset'2022-12-31T23:59:59Z'".
   *
   * The JSON representation is just the ISO 8601 string, e.g. "2022-12-31T23:59:59Z".
   */
  DateTimeOffset = "Edm.DateTimeOffset",
  /**
   * Represents fixed- or variable- length binary data.
   *
   * The URL representation requires one of two possible type prefixes "binary" or "X",
   * e.g. binary'23AB'.
   *
   * The JSON representation is a Base64 encoded string.
   */
  Binary = "Edm.Binary",
}
