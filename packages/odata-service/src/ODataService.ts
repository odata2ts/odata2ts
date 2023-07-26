import { ODataHttpClient } from "@odata2ts/http-client-api";

export class ODataService<ClientType extends ODataHttpClient> {
  constructor(protected client: ClientType, protected basePath: string, protected bigNumbersAsString: boolean = false) {
    if (!client) {
      throw new Error("[client] must be supplied to ODataService!");
    }
    if (!basePath || !basePath.trim()) {
      throw new Error("[basePath] must be supplied to ODataService!");
    }
    this.client.retrieveBigNumbersAsString(bigNumbersAsString);
  }

  public getPath(): string {
    return this.basePath;
  }

  protected addFullPath(path?: string) {
    return `${this.getPath()}${path ? "/" + path : ""}`;
  }
}
