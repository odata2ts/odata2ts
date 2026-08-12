import { Annotation, EntityType } from "../../../src/data-model/edmx/ODataEdmxModelBase.js";
import { CommonEntityAndComplexBuilderBase } from "./CommonEntityAndComplexBuilderBase.js";
import { createProperty } from "./ODataBuilderHelper.js";

export abstract class ODataEntityTypeBuilderBase<ET extends EntityType> extends CommonEntityAndComplexBuilderBase {
  protected entityType: ET = this.createVersionedEntityType();

  protected abstract createVersionedEntityType(): ET;

  public getEntityType() {
    return this.entityType;
  }

  public addProp(name: string, type: string, nullable?: boolean, maxLength?: number, precision?: number) {
    const prop = createProperty(name, type, nullable, maxLength, precision);
    this.entityType.Property.push(prop);
    return this;
  }

  public addKeyProp(name: string, type: string, maxLength?: number, precision?: number) {
    const prop = createProperty(name, type, false, maxLength, precision);
    this.entityType.Property.push(prop);
    this.entityType.Key[0].PropertyRef.push({ $: { Name: name } });

    return this;
  }

  // Only adds one key prop without adding the property itself to the props
  public addKeyOnly(name: string) {
    this.entityType.Key[0].PropertyRef.push({ $: { Name: name } });
    return this;
  }

  public addPropAnnotations(propName: string, annotations: Array<Annotation>) {
    const prop = this.entityType.Property.find((p) => p.$.Name === propName);
    if (!prop) {
      throw new Error(`Cannot annotate unknown property [${propName}]!`);
    }
    this.annotate(prop, annotations);
    return this;
  }

  public addTypeAnnotations(annotations: Array<Annotation>) {
    this.annotate(this.entityType, annotations);
    return this;
  }
}
