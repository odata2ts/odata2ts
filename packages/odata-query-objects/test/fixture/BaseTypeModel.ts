import { ENUMERABLE_PROP_DEFINITION, QNumberPath, QStringPath, QueryObject } from "../../src";

export interface PlanItemModel {
  "@odata.type": "Tester.PlanItem" | "Tester.Event" | "Tester.Flight";
  id: number;
  name: string | null;
}

export interface EventModel extends PlanItemModel {
  "@odata.type": "Tester.Event";
  description: string | null;
}

export interface FlightModel extends PlanItemModel {
  "@odata.type": "Tester.Flight";
  flightNumber: string;
}

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

export class QEvent extends QPlanItemBaseType<EventModel> {
  public readonly description = new QStringPath(this.withPrefix("Description"));
}

export class QFlight extends QPlanItemBaseType<FlightModel> {
  public readonly flightNumber = new QStringPath(this.withPrefix("FlightNumber"));
}
