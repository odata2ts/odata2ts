import { ODataVersionV4 } from "@odata2ts/odata-core";
import { StreamServiceBase } from "../StreamServiceBase.js";

/**
 * Access to binary data: a stream property (`Edm.Stream`) or the content of a media entity.
 * Spec: {@link https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html#sec_ManagingStreamProperties}
 *
 * The bound URL is the property name for a stream property and `$value` for a media entity's content.
 */
export class StreamServiceV4<V extends ODataVersionV4 = "4.0"> extends StreamServiceBase<V> {}
