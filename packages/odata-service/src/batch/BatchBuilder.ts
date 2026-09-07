import {
  BatchFormat,
  BatchHttpMethod,
  BatchRequestBody,
  BatchRequestObject,
  BatchResponseObject,
  BatchResponseBody,
  HttpResponseModel,
  ODataHttpClient,
} from "@odata2ts/http-client-api";
import { BlobGetRequestCmd } from "../request/BlobGetRequestCmd";
import { BlobUpdateRequestCmd } from "../request/BlobUpdateRequestCmd";
import { RequestCmd } from "../request/RequestCmd";
import { RequestInfo } from "../request/RequestInfo";
import { StreamGetRequestCmd } from "../request/StreamGetRequestCmd";
import { StreamUpdateRequestCmd } from "../request/StreamUpdateRequestCmd";

/**
 * The response odata2ts puts into a single slot of a batch result: that sub-request's answer, run through
 * the command's own response converters - or, where the sub-request never made it through, a synthesized
 * marker carrying status `0`. `T` is the command's final response structure, so the tuple {@link BatchBuilder.execute}
 * returns is element-for-element what the application would expect from running those requests one by one:
 * a slot that never ran is `T | undefined`, not a second batch-specific shape.
 */
export type BatchResponse<T> = HttpResponseModel<T | undefined>;

/** Options for adding one request to a batch. */
export interface BatchAddOptions {
  /**
   * Other commands in this batch whose sub-request must run before this one's. Order within a change set
   * guarantees nothing (§11.7.2), so this is the only way to say it. Given as the command objects
   * themselves; the builder resolves them to wire ids. The other format could not express a dependency that
   * is a forward reference or crosses a change set - those are refused where the format cannot carry them.
   */
  dependsOn?: Array<RequestCmd<any, any, any>>;
}

/** Options for sending one batch, overriding the service's defaults for this single call. */
export interface BatchExecuteOptions {
  /** Override the service's default wire format for this one batch. */
  format?: BatchFormat;
  /** Ask the server to answer what it can even where a sub-request fails (the `Prefer` header). */
  continueOnError?: boolean;
}

interface BatchEntry {
  cmd: RequestCmd<any, any, any>;
  /** The wire id, assigned in the order commands are added. */
  id: string;
  /** Set while an atomicity group (a multipart change set) is open. */
  group?: string;
  /** The dependencies, as command objects, resolved to wire ids when the body is built. */
  dependsOn: Array<RequestCmd<any, any, any>>;
  /** The prepared request, computed once and shared between building the body and dispatching the answer. */
  prepared?: RequestInfo<any>;
}

/**
 * Collects a set of requests and sends them as one `$batch`.
 *
 * The builder does not re-implement the pipeline a request goes through: each collected command is prepared
 * with the very {@link RequestCmd.prepareRequest} and its answer dispatched with the very
 * {@link RequestCmd.handleResponse} a direct request uses, so converters, the concurrency rule and the
 * cache-key harvesting all behave exactly as they would one by one. What the builder owns is what a direct
 * request has no need of: the wire ids, the one url rewrite (the service base path, stripped), the
 * atomicity-group framing, and the normalization of a sub-answer that never happened.
 */
export class BatchBuilder<R extends Array<unknown> = []> {
  private readonly __client: ODataHttpClient;
  private readonly __basePath: string;
  private readonly __defaultFormat: BatchFormat;
  private readonly __isV2: boolean;
  private readonly __entries: Array<BatchEntry> = [];
  private readonly __seen = new Set<RequestCmd<any, any, any>>();
  private __openGroup?: string;

  constructor(client: ODataHttpClient, basePath: string, defaultFormat: BatchFormat, isV2: boolean) {
    this.__client = client;
    this.__basePath = basePath;
    this.__defaultFormat = defaultFormat;
    this.__isV2 = isV2;
  }

  /**
   * Add one request to the batch. Blob and stream commands are refused - they carry a binary body the batch
   * wire formats cannot carry - as is adding the same instance twice.
   */
  public add<T>(cmd: RequestCmd<any, any, T>, options?: BatchAddOptions): BatchBuilder<[...R, BatchResponse<T>]> {
    if (BatchBuilder.isBatchIncompatible(cmd)) {
      throw new Error(
        "A blob or stream request cannot be part of a batch - its binary body is not a body the batch wire formats carry. Send it separately.",
      );
    }
    if (this.__seen.has(cmd)) {
      throw new Error("The same request instance cannot be added to a batch twice - each slot is one request.");
    }

    const id = String(this.__entries.length);
    this.__entries.push({ cmd, id, group: this.__openGroup, dependsOn: options?.dependsOn ?? [] });
    this.__seen.add(cmd);

    return this as unknown as BatchBuilder<[...R, BatchResponse<T>]>;
  }

  /** Open an atomicity group (a multipart change set). Commands added while it is open belong to it. */
  public startGroup(groupId: string): BatchBuilder<R> {
    if (this.__openGroup !== undefined) {
      throw new Error(`An atomicity group ("${this.__openGroup}") is already open - end it before opening another.`);
    }
    this.__openGroup = groupId;
    return this;
  }

  /** Close the open atomicity group. */
  public endGroup(): BatchBuilder<R> {
    if (this.__openGroup === undefined) {
      throw new Error("endGroup() with no atomicity group open.");
    }
    this.__openGroup = undefined;
    return this;
  }

  /**
   * The batch as it will be sent: wire ids assigned in the order the commands were added, the service base
   * path stripped off every sub-request url, and the atomicity group and `dependsOn` where they were set.
   */
  public getRequestInfo(): BatchRequestBody {
    this.__prepareAll();
    return this.__buildBody();
  }

  /**
   * Send the collected requests as one `$batch` and return their answers, one element per added command.
   *
   * A slot whose sub-request never ran is a synthesized answer with status `0` (`"Never Ran"`); one whose
   * own status is 2xx but whose atomicity group carries a failure is likewise a status-`0` marker
   * (`"Rolled Back"`), because a rolled-back change set undid it (§11.7.2). Everything else is the
   * sub-request's real answer, converted - the builder does not invent a second result type.
   */
  public async execute(options?: BatchExecuteOptions): Promise<R> {
    const format = options?.format ?? this.__defaultFormat;
    if (this.__isV2 && format === "json") {
      throw new Error("A V2 service has no JSON $batch - use format: \"multipart\".");
    }

    const body = this.getRequestInfo();
    const response = await this.__client.batch(this.__batchUrl(), body, {
      format,
      continueOnError: options?.continueOnError,
    });

    return this.__normalize(response.data) as unknown as R;
  }

  private static isBatchIncompatible(cmd: RequestCmd<any, any, any>): boolean {
    return (
      cmd instanceof BlobGetRequestCmd ||
      cmd instanceof BlobUpdateRequestCmd ||
      cmd instanceof StreamGetRequestCmd ||
      cmd instanceof StreamUpdateRequestCmd
    );
  }

  private __batchUrl(): string {
    return this.__basePath.replace(/\/$/, "") + "/$batch";
  }

  private __prepareAll(): void {
    for (const entry of this.__entries) {
      // a controlled write with no known ETag throws here - before anything is sent - so a doomed batch is
      // refused rather than sent
      if (entry.prepared === undefined) {
        entry.prepared = entry.cmd.prepareRequest();
      }
    }
  }

  private __buildBody(): BatchRequestBody {
    const idOf = new Map(this.__entries.map((entry) => [entry.cmd, entry.id]));

    const requests = this.__entries.map((entry): BatchRequestObject => {
      const prepared = entry.prepared!;
      const request: BatchRequestObject = {
        id: entry.id,
        method: BatchBuilder.toBatchMethod(prepared.method),
        url: this.__stripBasePath(prepared.url),
      };

      if (entry.group !== undefined) {
        request.atomicityGroup = entry.group;
      }

      const dependsOn = entry.dependsOn.map((dep) => idOf.get(dep));
      if (dependsOn.length > 0) {
        if (dependsOn.some((id) => id === undefined)) {
          throw new Error("A request depends on a command that is not part of this batch.");
        }
        request.dependsOn = dependsOn as Array<string>;
      }

      if (prepared.headers && Object.keys(prepared.headers).length > 0) {
        request.headers = prepared.headers;
      }
      if (prepared.data !== undefined) {
        request.body = prepared.data;
      }

      return request;
    });

    return { requests };
  }

  private __normalize(data: BatchResponseBody): Array<BatchResponse<any>> {
    const byId = new Map(data.responses.map((response) => [response.id, response]));
    const failedGroups = new Set(
      data.responses
        .filter((response) => response.atomicityGroup !== undefined && !BatchBuilder.is2xx(response.status))
        .map((response) => response.atomicityGroup!),
    );

    return this.__entries.map((entry) => {
      const response = byId.get(entry.id);

      if (response === undefined) {
        return { status: 0, statusText: "Never Ran", headers: {}, data: undefined };
      }
      if (
        BatchBuilder.is2xx(response.status) &&
        response.atomicityGroup !== undefined &&
        failedGroups.has(response.atomicityGroup)
      ) {
        return { status: 0, statusText: "Rolled Back", headers: {}, data: undefined };
      }

      const answer: HttpResponseModel<any> = {
        status: response.status,
        statusText: BatchBuilder.statusTextFor(response.status),
        headers: response.headers ?? {},
        data: response.body,
      };

      return entry.cmd.handleResponse(entry.prepared!, answer);
    });
  }

  private static is2xx(status: number): boolean {
    return status >= 200 && status < 300;
  }

  private static toBatchMethod(method: RequestInfo["method"]): BatchHttpMethod {
    return method.toLowerCase() as BatchHttpMethod;
  }

  private __stripBasePath(url: string): string {
    const base = this.__basePath.replace(/\/$/, "");
    const relative = url.startsWith(base) ? url.slice(base.length) : url;
    return relative.replace(/^\//, "");
  }

  private static statusTextFor(status: number): string {
    const known: Record<number, string> = {
      200: "OK",
      201: "Created",
      202: "Accepted",
      204: "No Content",
      304: "Not Modified",
      400: "Bad Request",
      401: "Unauthorized",
      403: "Forbidden",
      404: "Not Found",
      409: "Conflict",
      412: "Precondition Failed",
      424: "Failed Dependency",
      500: "Internal Server Error",
    };
    return known[status] ?? "";
  }
}
