import { ODataHttpClient, ODataHttpMethods } from "@odata2ts/http-client-api";
// import { CleanUndefined } from "@odata2ts/odata-query-objects";
import { RequestCmd, RequestCmdOptions } from "./RequestCmd";

export type CreateServiceFunction<ComposableService> = (path: string) => ComposableService;

export class ComposableUrlRequestCmd<
  ComposableService,
  ResponseStructure,
  DataStructure = undefined,
> extends RequestCmd<ResponseStructure, DataStructure> {
  constructor(
    client: ODataHttpClient,
    protected basePath: string,
    protected createService: CreateServiceFunction<ComposableService>,
    protected options: RequestCmdOptions<ResponseStructure, DataStructure> = {},
  ) {
    super(client, ODataHttpMethods.Get, undefined, options);
  }

  public getUrl(): string {
    return this.basePath;
  }

  /**
   * Allow for URL manipulation by creating an entirely new RequestCmd.
   *
   * @param url the new URL
   */
  public withUrl(url: string) {
    if (!url || !url.trim()) {
      throw new Error("withUrl requires a new URL!");
    }

    return new ComposableUrlRequestCmd<ComposableService, ResponseStructure, DataStructure>(
      this.client,
      url,
      this.createService,
      this.options,
    );
  }

  public compose() {
    return this.createService(this.getUrl());
  }
}
