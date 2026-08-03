import { FetchClientError } from "@odata2ts/http-client-fetch";
import { expect } from "vitest";

/**
 * Asserts that a request fails, and with which status and message.
 *
 * A bare `rejects.toThrow()` passes for any failure at all - a typo in the URL, a server that is down, a
 * 500 where a 404 was meant. Both halves are therefore mandatory here: the status says what the server
 * decided, the message says why, and only together do they pin the behaviour down.
 *
 * The promise is awaited **once**, which matters: `expect(...).rejects` twice would send a
 * state-changing request twice.
 *
 * @param promise the request under test, already started
 * @param expected the status to insist on, and a matcher for the error message
 * @returns the error, for assertions on further details
 */
export async function expectODataError(
  promise: Promise<unknown>,
  expected: { status: number; message: RegExp | string },
): Promise<FetchClientError> {
  const error = await promise.then(
    (result) => {
      throw new Error(`Expected the request to fail with ${expected.status}, but it succeeded: ${stringify(result)}`);
    },
    (failure: unknown) => failure as FetchClientError,
  );

  expect(error).toBeInstanceOf(FetchClientError);
  expect(error.status).toBe(expected.status);
  expect(error.message).toMatch(expected.message);

  return error;
}

function stringify(result: unknown) {
  try {
    return JSON.stringify(result);
  } catch {
    return String(result);
  }
}
