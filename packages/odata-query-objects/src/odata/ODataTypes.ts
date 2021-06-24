/**
 * Nominal typing for representing date & time formats while being strings.
 * See: https://basarat.gitbook.io/typescript/main-1/nominaltyping
 */

enum DateStringBrand {
  __ = "DateString",
}
enum TimeOfDayStringBrand {
  __ = "TimeOfDayString",
}
enum DateTimeOffsetStringBrand {
  __ = "DateTimeOffsetString",
}

/**
 * Represents an ISO 8601 date.
 *
 * Format: YYYY-MM-DD
 *
 * Example: "2021-01-31"
 */
export type DateString = string & DateStringBrand;

/**
 * Represents an ISO 8601 time.
 *
 * Format: hh:mm:ss.sss
 *
 * Example: "13:21:00" || "13:21:00.123"
 */
export type TimeOfDayString = string & TimeOfDayStringBrand;

/**
 * Represents an ISO 8601 date time with offset.
 *
 * Format: YYYY-MM-DD'T'hh:mm:ss'Z'
 *
 * Example: "2021-01-31T13:21:00Z"
 */
export type DateTimeOffsetString = string & DateTimeOffsetStringBrand;
