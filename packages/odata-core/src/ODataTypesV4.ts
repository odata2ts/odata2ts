/**
 * Enumerates all possible V4 EDMX data types.
 *
 * V4 dispenses with the following V2 data types:
 * - Edm.Time
 * - Edm.DateTime
 *
 * V4 introduces the following new data types:
 * - Edm.Duration
 * - Edm.TimeOfDay
 * - Edm.Date
 * - Edm.Stream
 * - a bunch of geography types
 * - a bunch of geometry types
 *
 * V4 dispenses with any type prefixing or suffixing in URL representations. Hence, we don't need to
 * discriminate between URL and JSON usage anymore. Types like Edm.Guid are just literal values which
 * need to conform to a specific format.
 *
 * V4 also treats numeric values differently: While V2 only mapped Edm.Int16 and Edm.Int32 to numbers,
 * V4 maps all numeric types to numbers. Note: Values of type Edm.Int64 and Edm.Decimal may exceed the
 * capacity of the JS number type. In these case these numbers should be mapped to string to not lose
 * any precision, see the "IEEE754Compatible" parameter
 * {@link https://docs.oasis-open.org/odata/odata-json-format/v4.01/odata-json-format-v4.01.html#_Toc38457729}.
 */
export enum ODataTypesV4 {
  Boolean = "Edm.Boolean",
  String = "Edm.String",
  /**
   * Unsigned 8-bit integer value
   */
  Byte = "Edm.Byte",
  /**
   * Represents a signed 8-bit integer value
   */
  SByte = "Edm.SByte",
  /**
   * Represents a signed 16-bit integer value
   */
  Int16 = "Edm.Int16",
  /**
   * Represents a signed 32-bit integer value
   */
  Int32 = "Edm.Int32",
  /**
   * Represents a signed 64-bit integer value
   */
  Int64 = "Edm.Int64",
  /**
   * Represents a floating point number with 7 digits precision
   */
  Single = "Edm.Single",
  /**
   * Represents a floating point number with 15 digits precision
   */
  Double = "Edm.Double",
  /**
   * Represents numeric values with fixed precision and scale
   */
  Decimal = "Edm.Decimal",
  /**
   * Represents a 16-byte (128-bit) unique identifier value
   */
  Guid = "Edm.Guid",
  /**
   * Represent a specific time of a day, which conforms to ISO 8601 time format,
   * e.g. "12:59:59" or with millisecond precision "10:40:12.123".
   */
  TimeOfDay = "Edm.TimeOfDay",
  /**
   * Represents a specific day, which conforms to ISO 8601 date format,
   * e.g. "2022-12-31".
   */
  Date = "Edm.Date",
  /**
   * Represents a specific point in time, independent of any time zones, according
   * to the ISO 8601 dateTime format, e.g. "2022-12-31T12:59:59Z".
   *
   * The suffix "Z" signals "Zulu time", i.e. GMT without any offset. This should
   * be the only format needed and used for nearly all cases of communicating
   * date times between server and client.
   *
   * However, an offset can be communicated by adding "(+|-)HH:MM" thereby specifying hours and minutes,
   * e.g. "2022-12-31T12:59:59+01:00".
   */
  DateTimeOffset = "Edm.DateTimeOffset",
  /**
   * Represents a duration conforming to ISO 8601 duration format
   * ({@link https://en.wikipedia.org/wiki/ISO_8601#Durations}).
   *
   * Examples:
   * - P1Y = 1 year
   * - P12D = 12 days
   * - PT15H50M30S = 15 hours, 50 minutes and 30 seconds
   * - PT1.123S = with millisecond precision
   */
  Duration = "Edm.Duration",
  /**
   * Represents fixed- or variable- length binary data.
   *
   * Represented as Base64 encoded string.
   */
  Binary = "Edm.Binary",
  /**
   * Represents a streamable property.
   *
   * The content of the stream is not directly exposed as JSON result, it must be exclusively accessed
   * (cf. {@link https://docs.oasis-open.org/odata/odata-json-format/v4.01/odata-json-format-v4.01.html#sec_StreamProperty}).
   *
   * Most filter operators don't work with streams.
   */
  Stream = "Edm.Stream",
  Geography = "Geography",
  GeographyPoint = "GeographyPoint",
  GeographyLineString = "GeographyLineString",
  GeographyPolygon = "GeographyPolygon",
  GeographyMultiPoint = "GeographyMultiPoint",
  GeographyMultiLineString = "GeographyMultiLineString",
  GeographyCollection = "GeographyCollection",
  Geometry = "Geometry",
  GeometryPoint = "GeometryPoint",
  GeometryLineString = "GeometryLineString",
  GeometryPolygon = "GeometryPolygon",
  GeometryMultiPoint = "GeometryMultiPoint",
  GeometryMultiPolygon = "GeometryMultiPolygon",
  GeometryCollection = "GeometryCollection",
}
