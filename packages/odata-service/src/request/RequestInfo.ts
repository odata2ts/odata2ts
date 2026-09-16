import { ODataHttpMethods } from "@odata2ts/http-client-api";

export class RequestInfo<DataStructure = undefined> {
  public constructor(
    readonly method: ODataHttpMethods,
    readonly url: string,
    readonly headers?: Record<string, string>,
    readonly data?: DataStructure,
  ) {}

  public withData<NewDataStructure = DataStructure>(data: NewDataStructure) {
    return new RequestInfo(this.method, this.url, this.headers, data);
  }
}
