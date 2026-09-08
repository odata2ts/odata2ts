import {
  BatchFormat,
  BatchHttpMethod,
  BatchRequestBody,
  BatchRequestObject,
  BatchResponseBody,
  BatchResponseObject,
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
   * The wire ids of the requests in this batch whose sub-request must run before this one's. Order within a
   * change set guarantees nothing (§11.7.2), so this is the only way to say it. A static list names already-added
   * ids; in the factory form of {@link BatchBuilder.add} a callback `(selfRef) => number[]` is resolved against
   * the id the command is about to receive, so a relative dependency (`[selfRef - 1]`) is expressible. Each id
   * must name a request added before this one (a wire id between `1` and this request's own id minus one); a
   * self- or forward-reference is refused. A dependency that is a forward reference or crosses a change set is
   * refused where the format cannot carry it.
   */
  dependsOn?: Array<number> | ((selfRef: number) => Array<number>);
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
  /** The dependencies, as the wire ids of the preceding requests this one waits on. */
  dependsOn: Array<number>;
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
  private __openGroup?: string;

  constructor(client: ODataHttpClient, basePath: string, defaultFormat: BatchFormat, isV2: boolean) {
    this.__client = client;
    this.__basePath = basePath;
    this.__defaultFormat = defaultFormat;
    this.__isV2 = isV2;
  }

  /**
   * Add one request to the batch. Blob and stream commands are refused - they carry a binary body the batch
   * wire formats cannot carry. The same command may be added more than once: it is reused across its slots
   * (the batch never mutates a command's state), so sending the same request twice is simply adding it twice.
   *
   * Two forms. The plain form takes the ready command. The factory form takes a function that builds the
   * command knowing the wire id it is about to receive - `selfRef` - so the immediately-preceding request is
   * `selfRef - 1` and a reference to it (`byRef(selfRef - 1)`) needs no hand-counting. Both return the builder,
   * so the chain stays fluent.
   */
  public add<T>(
    cmdOrFactory: RequestCmd<any, any, T> | ((selfRef: number) => RequestCmd<any, any, T>),
    options?: BatchAddOptions,
  ): BatchBuilder<[...R, BatchResponse<T>]> {
    const id = this.__entries.length + 1;
    const dependsOn = BatchBuilder.resolveDependsOn(options?.dependsOn, id);
    this.__validateDependsOn(dependsOn, id);
    const cmd = typeof cmdOrFactory === "function" ? cmdOrFactory(id) : cmdOrFactory;

    if (BatchBuilder.isBatchIncompatible(cmd)) {
      throw new Error(
        "A blob or stream request cannot be part of a batch - its binary body is not a body the batch wire formats carry. Send it separately.",
      );
    }

    this.__entries.push({ cmd, id: String(id), group: this.__openGroup, dependsOn });

    return this as unknown as BatchBuilder<[...R, BatchResponse<T>]>;
  }

  /**
   * A `dependsOn` may be stated statically or, in the factory form of {@link add}, as a callback that is
   * resolved against the id the command is about to receive - which is what lets a relative dependency
   * (`[selfRef - 1]`) name the previous request.
   */
  private static resolveDependsOn(
    dependsOn: BatchAddOptions["dependsOn"] | undefined,
    selfRef: number,
  ): Array<number> {
    return typeof dependsOn === "function" ? dependsOn(selfRef) : dependsOn ?? [];
  }

  /**
   * A `dependsOn` may only name a request added before this one - the ids it is given are the wire ids of the
   * requests already in the batch, and this request cannot wait on itself or on a request that comes after it.
   * Checked here, where the dependency is stated, so a bad one is refused before the batch is built or sent.
   */
  private __validateDependsOn(dependsOn: Array<number> | undefined, selfRef: number): void {
    for (const dep of dependsOn ?? []) {
      if (!Number.isInteger(dep) || dep < 1 || dep >= selfRef) {
        throw new Error(
          `A request can only depend on a request added before it (a wire id between 1 and ${selfRef - 1}); got ${dep}.`,
        );
      }
    }
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
      throw new Error('A V2 service has no JSON $batch - use format: "multipart".');
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

      if (entry.dependsOn.length > 0) {
        request.dependsOn = entry.dependsOn.map((dep) => String(dep));
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
