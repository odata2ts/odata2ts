import { ODataHttpClient } from "@odata2ts/http-client-api";
import { ODataServiceOptions } from "../ODataServiceOptions";
import { StreamServiceBase } from "../StreamServiceBase.js";

/**
 * Access to the media resource of a media link entry, i.e. the binary content of an entity declared
 * `m:HasStream="true"`.
 * Spec: {@link https://www.odata.org/documentation/odata-version-2-0/operations/} - 2.7 Media Resources
 *
 * V2 knows no `Edm.Stream`, so unlike in V4 there is no second carrier of binary data: the only URL this
 * service is ever bound to is the entity's `$value`, and an entity can carry exactly one such payload.
 * That is also why it is not generated for any property - a V2 model has no way of declaring one.
 */
export class StreamServiceV2 extends StreamServiceBase {
  public constructor(client: ODataHttpClient, basePath: string, name: string, options?: ODataServiceOptions) {
    super(client, basePath, name, options);
  }
}
