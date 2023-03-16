import { AxiosError } from "axios";

export class AxiosODataClientError extends Error {
  name = "AxiosODataClientError";
  isAxiosOdataClientError = true;
  cause?: AxiosError;
  constructor(msg: string, options?: { cause?: Error }) {
    super(msg, options);
  }
}
