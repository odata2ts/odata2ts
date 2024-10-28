import { ODataHttpClient } from "@odata2ts/http-client-api";
import {
  ENUMERABLE_PROP_DEFINITION,
  QId,
  QNumberParam,
  QNumberPath,
  QStringPath,
  QueryObject,
} from "@odata2ts/odata-query-objects";
import { EntitySetServiceV4, EntityTypeServiceV4, ODataServiceOptionsInternal } from "../../../src";

export interface PlanItemModel {
  "@odata.type"?: "#Tester.PlanItem" | "#Tester.Event" | "#Tester.Flight";
  id: number;
  name: string | null;
}

export interface EditablePlanItemModel
  extends Pick<PlanItemModel, "id" | "@odata.type">,
    Partial<Pick<PlanItemModel, "name">> {}

export type PlanItemIdModel = string | { id: number };

export interface EventModel extends PlanItemModel {
  "@odata.type"?: "#Tester.Event";
  description: string | null;
}

export interface EditableEventModel
  extends Pick<EventModel, "id" | "@odata.type">,
    Partial<Pick<EventModel, "name" | "description">> {}

export interface FlightModel extends PlanItemModel {
  "@odata.type"?: "#Tester.Flight";
  flightNumber: string;
}

export interface EditableFlightModel
  extends Pick<FlightModel, "id" | "@odata.type" | "flightNumber">,
    Partial<Pick<EventModel, "name">> {}

export class QPlanItemBaseType<Model extends PlanItemModel> extends QueryObject<Model> {
  public readonly id = new QNumberPath(this.withPrefix("Id"));
  public readonly name = new QStringPath(this.withPrefix("Name"));
}

export class QPlanItem extends QPlanItemBaseType<PlanItemModel> {
  protected readonly __subtypeMapping = { "Tester.Event": "QEvent", "Tester.Flight": "QFlight" };

  protected get __asQEvent() {
    return new QEvent(this.withPrefix("Tester.Event"));
  }

  protected get __asQFlight() {
    return new QFlight(this.withPrefix("Tester.Flight"));
  }

  public get QEvent_description() {
    return this.__asQEvent.description;
  }

  public get QFlight_flightNumber() {
    return this.__asQFlight.flightNumber;
  }
}

Object.defineProperties(QPlanItem.prototype, {
  QEvent_description: ENUMERABLE_PROP_DEFINITION,
  QFlight_flightNumber: ENUMERABLE_PROP_DEFINITION,
});

export class QPlanItemId extends QId<PlanItemIdModel> {
  getParams() {
    return [new QNumberParam("Id", "id")];
  }
}

export class QEvent extends QPlanItemBaseType<EventModel> {
  public readonly description = new QStringPath(this.withPrefix("Description"));
}

export class QFlight extends QPlanItemBaseType<FlightModel> {
  public readonly flightNumber = new QStringPath(this.withPrefix("FlightNumber"));
}

export class PlanItemService<ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  PlanItemModel,
  EditablePlanItemModel,
  QPlanItem
> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal) {
    super(client, basePath, name, new QPlanItem(), options);
  }

  public asFlightService() {
    const { client, path, options } = this.__base;
    options.subtype = true;
    return new FlightService(client, path, "Tester.Flight", options);
  }

  public asEventService() {
    const { client, path, options } = this.__base;
    options.subtype = true;
    return new EventService(client, path, "Tester.Event", options);
  }
}

export class PlanItemCollectionService<ClientType extends ODataHttpClient> extends EntitySetServiceV4<
  ClientType,
  PlanItemModel,
  EditablePlanItemModel,
  QPlanItem,
  PlanItemIdModel
> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal) {
    super(client, basePath, name, new QPlanItem(), new QPlanItemId(name), options);
  }

  public asFlightCollectionService() {
    const { client, path, options } = this.__base;
    options.subtype = true;
    return new FlightCollectionService(client, path, "Tester.Flight", options);
  }

  public asEventCollectionService() {
    const { client, path, options } = this.__base;
    options.subtype = true;
    return new EventCollectionService(client, path, "Tester.Event", options);
  }
}

export class FlightService<ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  FlightModel,
  EditableFlightModel,
  QFlight
> {
  constructor(client: ClientType, basePath: string, name: string, options: ODataServiceOptionsInternal) {
    super(client, basePath, name, new QFlight(), options);
  }
}

export class FlightCollectionService<ClientType extends ODataHttpClient> extends EntitySetServiceV4<
  ClientType,
  FlightModel,
  EditableFlightModel,
  QFlight,
  PlanItemIdModel
> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal) {
    super(client, basePath, name, new QFlight(), new QPlanItemId(name), options);
  }
}

export class EventService<ClientType extends ODataHttpClient> extends EntityTypeServiceV4<
  ClientType,
  EventModel,
  EditableEventModel,
  QEvent
> {
  constructor(client: ClientType, basePath: string, name: string, options: ODataServiceOptionsInternal) {
    super(client, basePath, name, new QEvent(), options);
  }
}

export class EventCollectionService<ClientType extends ODataHttpClient> extends EntitySetServiceV4<
  ClientType,
  EventModel,
  EditableEventModel,
  QEvent,
  PlanItemIdModel
> {
  constructor(client: ClientType, basePath: string, name: string, options?: ODataServiceOptionsInternal) {
    super(client, basePath, name, new QEvent(), new QPlanItemId(name), options);
  }
}
