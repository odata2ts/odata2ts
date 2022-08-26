import { ODataClient } from "@odata2ts/odata-client-api";

export type ODataClientConfig<ClientType extends ODataClient> = ClientType extends ODataClient<infer Config>
  ? Config
  : never;

/**
 * Typing for a property which can be used as inline parameter.
 */
export interface InlineUrlProp {
  /**
   * Whether the value of the property should be used as-is.
   * If false, values need to be quoted with single quotes.
   */
  isLiteral: boolean;
  /**
   * Only required for V2 types like datetime or guid, e.g. guid'12345678-BBBb-cCCCC-0000-123456789012'.
   *
   * If specified, property isLiteral is ignored (it's automatically true).
   */
  typePrefix?: string;
  /**
   *
   */
  value?: any;
}

/**
 * Typing for one set of properties which are used as inline parameters of functions.
 * E.g. GetNearestAirport(lat=51.918777,lon=8.620930) => { lat: { isLiteral: true, value=51.9 }, lon: { isLiteral: true, value=8.6 }}}
 */
export type InlineUrlProps = { [prop: string]: InlineUrlProp };

/**
 * All information about a property which is part of the entity key.
 */
export interface EntityKeyProp {
  /**
   * Whether the value of the property should be used as-is.
   * If false, values need to be quoted with single quotes.
   */
  isLiteral: boolean;
  /**
   * Only required for V2 types like datetime or guid, e.g. guid'12345678-BBBb-cCCCC-0000-123456789012'.
   *
   * If specified, property isLiteral is ignored (it's automatically true).
   */
  typePrefix?: string;
  /**
   * JS type of the property, e.g. "string" or "number"
   *
   * Required for parsing a key and converting it
   */
  type: string;
  /**
   * The name of the property.
   */
  name: string;
  /**
   * The property name known to OData.
   */
  odataName: string;
}

/**
 * Describes a runtime object which holds information about the key of an entity.
 * In the most simple case, the array contains one KeyProp, e.g. the id.
 * However, it also allows for complex keys.
 */
export type EntityKeySpec = Array<EntityKeyProp>;
