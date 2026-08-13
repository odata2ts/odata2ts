import { withNamespace } from "./DataModel.js";
import { Annotation, ComplexType, EntityType, EnumType, Member, Property, Schema } from "./edmx/ODataEdmxModelBase.js";

const ALLOWED_VALUES = "Org.OData.Validation.V1.AllowedValues";
const SYMBOLIC_NAME = "Org.OData.Core.V1.SymbolicName";
const VALUE_PROPERTY = "Value";

const COLLECTION_PREFIX = "Collection(";

/**
 * What a synthesized enum needs beyond its EDMX declaration: the primitive type its values travel as.
 *
 * A declared enum goes on the wire as the name of its member. This one does not exist as far as the
 * service is concerned - the property keeps the primitive type it was declared with - so what travels is
 * the value behind the name, and the generated client needs a conversion the declared case never needs.
 */
export interface SynthesizedEnum {
  wireType: string;
}

/**
 * Turns properties which merely *describe* an enumeration into one - the strategy
 * {@link EnumSynthesis.allowedValuesAndSymbolicName}, which `enumSynthesized` opts in to by name.
 *
 * A service may state the values a property accepts as `Validation.AllowedValues`, each with a symbolic
 * name in a nested `Core.SymbolicName` - SAP CAP does exactly this, because a CDS enum is a constraint on
 * a value rather than a type of its own, so `<EnumType>` never appears in its metadata and every enum
 * arrives as a bare `Edm.Byte` or `Edm.Int32`.
 *
 * The reshaping happens on the EDMX itself, before anything is digested, so from here on the document
 * looks like one that declared the enum to begin with and the whole generation path downstream - models,
 * query objects, services - needs to know nothing about the annotation.
 *
 * Two things it deliberately does not do:
 *
 * - A record without a `Core.SymbolicName` has no name to generate, and an enum missing one of its values
 *   would reject a value the service accepts. So a property is converted only if *every* record carries
 *   one, and otherwise left exactly as it was.
 * - `AllowedValues` says nothing about whether values may be combined, and unlike a declared enum there is
 *   no `IsFlags` to state it. A bit mask therefore becomes an ordinary enum here - one which does not even
 *   offer `has` - and any combination of its members is a value the generated type does not know.
 */
export class AllowedValuesEnumSynthesizer<ET extends EntityType, CT extends ComplexType> {
  private readonly synthesized = new Map<string, SynthesizedEnum>();

  /**
   * The enums created so far per schema, keyed by their members, so that the same enumeration stated on
   * several properties becomes one type rather than one per property.
   */
  private readonly byMembers = new Map<string, string>();

  /**
   * Every name already taken in a schema - the types it declares plus the enums created here.
   */
  private readonly takenNames = new Map<string, Set<string>>();

  constructor(private readonly schemas: Array<Schema<ET, CT>>) {
    for (const schema of schemas) {
      this.takenNames.set(
        schema.$.Namespace,
        new Set(
          [...(schema.EnumType ?? []), ...(schema.ComplexType ?? []), ...(schema.EntityType ?? [])].map(
            (model) => model.$.Name,
          ),
        ),
      );
    }
  }

  /**
   * Adds an `EnumType` for every property which describes one and points the property at it.
   *
   * @return the enums created, by fully qualified name
   */
  public synthesize(): Map<string, SynthesizedEnum> {
    for (const schema of this.schemas) {
      for (const model of [...(schema.EntityType ?? []), ...(schema.ComplexType ?? [])]) {
        for (const prop of model.Property ?? []) {
          this.convertProp(schema, prop);
        }
      }
    }
    return this.synthesized;
  }

  private convertProp(schema: Schema<ET, CT>, prop: Property): void {
    const members = readAllowedValues(prop.Annotation);
    if (!members) {
      return;
    }
    const wireType = stripCollection(prop.$.Type);
    // the annotation may sit on a property of any type; only a primitive one is an enumeration in
    // disguise, a structured one has its own members already
    if (!wireType.startsWith("Edm.")) {
      return;
    }

    const fqName = this.declareEnum(schema, prop.$.Name, wireType, members);
    prop.$.Type = prop.$.Type.startsWith(COLLECTION_PREFIX) ? `${COLLECTION_PREFIX}${fqName})` : fqName;
  }

  /**
   * Declares the enum for a set of members, or returns the one already declared for exactly these members.
   */
  private declareEnum(schema: Schema<ET, CT>, propName: string, wireType: string, members: Array<Member>): string {
    const namespace = schema.$.Namespace;
    const key = `${namespace}:${wireType}:${members.map((m) => `${m.$.Name}=${m.$.Value}`).join(",")}`;
    const known = this.byMembers.get(key);
    if (known) {
      return known;
    }

    const name = this.uniqueName(namespace, propName);
    const fqName = withNamespace(namespace, name);
    schema.EnumType = [...(schema.EnumType ?? []), { $: { Name: name, UnderlyingType: wireType }, Member: members }];
    this.byMembers.set(key, fqName);
    this.synthesized.set(fqName, { wireType });

    return fqName;
  }

  /**
   * The property's own name, which is what the service would have called the type had it declared one.
   * Where that name is taken - by a declared type, or by an enum of the same name but different members -
   * a counter settles it, the same way the generator resolves any other name clash.
   */
  private uniqueName(namespace: string, propName: string): string {
    const taken = this.takenNames.get(namespace)!;
    let name = propName;
    for (let counter = 2; taken.has(name); counter++) {
      name = `${propName}${counter}`;
    }
    taken.add(name);
    return name;
  }
}

/**
 * The members an `AllowedValues` annotation describes, or undefined if it describes none we can use.
 */
function readAllowedValues(annotations: Array<Annotation> | undefined): Array<Member> | undefined {
  const records = annotations
    ?.find((annotation) => annotation.$.Term === ALLOWED_VALUES)
    ?.Collection?.flatMap((collection) => collection.Record ?? []);
  if (!records?.length) {
    return undefined;
  }

  const members: Array<Member> = [];
  for (const record of records) {
    const name = record.Annotation?.find((annotation) => annotation.$.Term === SYMBOLIC_NAME)?.$.String;
    const value = record.PropertyValue?.find((pv) => pv.$.Property === VALUE_PROPERTY)?.$;
    if (!name || !value) {
      return undefined;
    }
    const literal = value.Int ?? value.String;
    if (literal === undefined) {
      return undefined;
    }
    members.push({ $: { Name: name, Value: value.Int !== undefined ? Number(value.Int) : literal } });
  }

  return members;
}

function stripCollection(type: string): string {
  return type.startsWith(COLLECTION_PREFIX) ? type.substring(COLLECTION_PREFIX.length, type.length - 1) : type;
}
