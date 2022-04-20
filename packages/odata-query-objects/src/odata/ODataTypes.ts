/**
 * Nominal typing for representing date & time formats while being strings.
 * See: https://basarat.gitbook.io/typescript/main-1/nominaltyping
 */

/**
 * Represents an ISO 8601 date.
 *
 * Format: YYYY-MM-DD
 *
 * Example: "2021-01-31"
 */
export type DateString = string & DateStringBrand;
enum DateStringBrand {
  __ = "DateString",
}

/**
 * Represents an ISO 8601 time.
 *
 * Format: hh:mm:ss.sss
 *
 * Example: "13:21:00" || "13:21:00.123"
 */
export type TimeOfDayString = string & TimeOfDayStringBrand;
enum TimeOfDayStringBrand {
  __ = "TimeOfDayString",
}

/**
 * Represents an ISO 8601 date time with offset.
 *
 * Format: YYYY-MM-DD'T'hh:mm:ss'Z'
 *
 * Example: "2021-01-31T13:21:00Z"
 */
export type DateTimeOffsetString = string & DateTimeOffsetStringBrand;
enum DateTimeOffsetStringBrand {
  __ = "DateTimeOffsetString",
}

/**
 * Represents a Base64 encoded binary value.
 */
export type BinaryString = string & BinaryStringBrand;
enum BinaryStringBrand {
  _ = "",
}

/**
 * Literal form of Edm.Guid as used in URIs formatted as a JSON string
 */
export type GuidString = string & GuidStringBrand;
enum GuidStringBrand {
  _ = "",
}

export type TimeV2String = string & TimeV2StringBrand;
enum TimeV2StringBrand {
  _ = "",
}

export type DateTimeV2String = string & DateTimeV2StringBrand;
enum DateTimeV2StringBrand {
  _ = "",
}

export type DateTimeOffsetV2String = string & DateTimeOffsetV2StringBrand;
enum DateTimeOffsetV2StringBrand {
  _ = "",
}
