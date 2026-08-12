import { Annotatable, Annotation, ODataEdmxModelBase } from "./edmx/ODataEdmxModelBase.js";

/** Microsoft's annotation namespace, from WCF Data Services and the EF designer. */
const NS_MS_ANNOTATION = "http://schemas.microsoft.com/ado/2009/02/edm/annotation";
/** SAP Gateway's annotation namespace. */
const NS_SAP = "http://www.sap.com/Protocols/SAPData";

const CORE = "Org.OData.Core.V1";
const COMPUTED = `${CORE}.Computed`;
const IMMUTABLE = `${CORE}.Immutable`;

/**
 * The local names of the terms this produces, to recognize a document which states them itself.
 */
const MANAGED_TERMS = ["Computed", "ComputedDefaultValue", "Immutable", "Permissions"];

/**
 * An element as xml2js hands it over: attributes in `$`, child elements under their own name.
 *
 * Namespace declarations arrive as ordinary attributes here - xml2js does not process them - which is
 * precisely why the prefixes have to be resolved by hand below.
 */
interface XmlElement {
  $?: Record<string, string>;
  [child: string]: unknown;
}

/** Prefix to namespace URI, as declared by the `xmlns:*` attributes in scope at a given element. */
type NamespaceScope = ReadonlyMap<string, string>;

const XMLNS_PREFIX = "xmlns:";

/**
 * Translates the two attribute dialects of the OData V2 era into the V4 terms they mean, so that
 * everything downstream reads one set of annotations no matter which version the document is.
 *
 * V2 has no vocabularies at all - the mechanism arrives in 3.0 and the standard terms in V4 - so what a
 * V4 service states as `<Annotation Term="Core.Computed"/>` is carried by an attribute in a foreign
 * namespace instead. Two of those got produced widely enough to be worth reading:
 *
 * | V2                                                    | V4                 |
 * | :---------------------------------------------------- | :----------------- |
 * | `annotation:StoreGeneratedPattern="Identity"`         | `Core.Computed`    |
 * | `annotation:StoreGeneratedPattern="Computed"`         | `Core.Computed`    |
 * | `sap:creatable="false"` and `sap:updatable="false"`   | `Core.Computed`    |
 * | `sap:updatable="false"`, `creatable` left at default  | `Core.Immutable`   |
 *
 * `Identity` and `Computed` differ in whether the store regenerates the value on every update, which is
 * a distinction no V4 term draws and nothing downstream acts on; both mean the client never supplies a
 * value. The fourth combination - `creatable="false"` with `updatable="true"`, settable never but
 * changeable later - has no V4 counterpart at all and is deliberately dropped rather than mapped onto a
 * term that would overstate it: guessing wrong there removes a writable property from the editable
 * model, which is the more damaging error.
 *
 * `Core.ComputedDefaultValue` and `Core.Permissions` have no V2 form whatsoever, so a V2 document can
 * only ever yield two of the four terms.
 *
 * ## Why the prefixes cannot be taken at face value
 *
 * `sap:` and `annotation:` are conventional, not required: a prefix is bound to its namespace by an
 * `xmlns:` declaration, any document may choose another one, and the binding holds for the element it
 * is declared on and its descendants. Servers differ on where they put it. Apache Olingo 2 re-declares
 * the namespace on **every annotated property** rather than hoisting it to the root:
 *
 * ```xml
 * <Property Name="LoanedAt" … sap:updatable="false" xmlns:sap="http://www.sap.com/Protocols/SAPData">
 * ```
 *
 * while SAP Gateway declares it once on `edmx:Edmx`. So the scope is threaded down the element chain
 * here and matching happens on the namespace URI, never on the prefix - the same discipline the
 * {@link AnnotationResolver} applies to vocabulary aliases, one layer further down.
 */
export function resolveV2Annotations(model: ODataEdmxModelBase<any>): void {
  const root = model["edmx:Edmx"] as unknown as XmlElement;
  if (!root) {
    return;
  }

  const rootScope = extendScope(new Map(), root);
  for (const dataService of asArray(root["edmx:DataServices"])) {
    const dataServiceScope = extendScope(rootScope, dataService);
    for (const schema of asArray(dataService.Schema)) {
      const schemaScope = extendScope(dataServiceScope, schema);
      for (const model of [...asArray(schema.EntityType), ...asArray(schema.ComplexType)]) {
        const modelScope = extendScope(schemaScope, model);
        for (const property of asArray(model.Property)) {
          annotate(property, extendScope(modelScope, property));
        }
      }
    }
  }
}

/**
 * The namespace scope of an element: whatever it inherits, plus its own `xmlns:` declarations. A
 * declaration of a prefix already in scope shadows the outer one, which is what makes this a chain
 * rather than a lookup.
 */
function extendScope(inherited: NamespaceScope, element: XmlElement): NamespaceScope {
  const declarations = Object.entries(element.$ ?? {}).filter(([name]) => name.startsWith(XMLNS_PREFIX));
  if (!declarations.length) {
    return inherited;
  }
  const scope = new Map(inherited);
  for (const [name, uri] of declarations) {
    scope.set(name.substring(XMLNS_PREFIX.length), uri);
  }
  return scope;
}

/**
 * The value of an attribute of the given namespace and local name, whatever prefix the document bound
 * that namespace to.
 */
function attributeValue(element: XmlElement, scope: NamespaceScope, namespace: string, localName: string) {
  for (const [name, value] of Object.entries(element.$ ?? {})) {
    const separator = name.indexOf(":");
    if (separator < 0 || name.substring(separator + 1) !== localName) {
      continue;
    }
    if (scope.get(name.substring(0, separator)) === namespace) {
      return value;
    }
  }
  return undefined;
}

function annotate(property: XmlElement, scope: NamespaceScope): void {
  // a document which states the terms itself has said everything there is to say - the V2 attributes
  // are the fallback for one that cannot
  if (statesManagedTerm(property as Annotatable)) {
    return;
  }

  const term = sapTerm(property, scope) ?? storeGeneratedTerm(property, scope);
  if (term) {
    const annotatable = property as Annotatable;
    annotatable.Annotation = [...(annotatable.Annotation ?? []), tag(term)];
  }
}

/**
 * SAP's pair, which only means anything as a pair: both attributes default to `true`, and it is the
 * combination that names a term.
 */
function sapTerm(property: XmlElement, scope: NamespaceScope): string | undefined {
  const creatable = attributeValue(property, scope, NS_SAP, "creatable") !== "false";
  const updatable = attributeValue(property, scope, NS_SAP, "updatable") !== "false";

  if (updatable) {
    // creatable=false with updatable=true has no V4 counterpart - see the class docs
    return undefined;
  }
  return creatable ? IMMUTABLE : COMPUTED;
}

/** Microsoft's attribute, which cannot express `Immutable`: it describes generation, not writability. */
function storeGeneratedTerm(property: XmlElement, scope: NamespaceScope): string | undefined {
  const pattern = attributeValue(property, scope, NS_MS_ANNOTATION, "StoreGeneratedPattern");
  return pattern === "Identity" || pattern === "Computed" ? COMPUTED : undefined;
}

function statesManagedTerm(element: Annotatable): boolean {
  return !!element.Annotation?.some((annotation) => {
    const term = annotation.$?.Term;
    return !!term && MANAGED_TERMS.includes(term.substring(term.lastIndexOf(".") + 1));
  });
}

/** A tag term in the shape the digestion expects, with its name already fully qualified. */
function tag(term: string): Annotation {
  return { $: { Term: term, Bool: "true" } };
}

function asArray(value: unknown): Array<XmlElement> {
  return Array.isArray(value) ? (value as Array<XmlElement>) : [];
}
