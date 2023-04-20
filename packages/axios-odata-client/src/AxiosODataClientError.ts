import { AxiosError } from "axios";

export class AxiosODataClientError extends Error {
  name = "AxiosODataClientError";
  status?: number;
  cause?: AxiosError;
  constructor(msg: string, status?: number, options?: { cause?: Error }) {
    super(msg, options);
    this.status = status;
  }
}
