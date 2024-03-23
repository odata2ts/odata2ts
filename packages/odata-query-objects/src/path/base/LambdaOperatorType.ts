import { QFilterExpression } from "../../QFilterExpression";

export type LambdaOperatorType<CollectionType> = (qObject: CollectionType) => QFilterExpression | void;
