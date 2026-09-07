import { NamespaceOptions } from "../OptionModel.js";
import { NamespaceWithAlias } from "./DataModel.js";

const SIMPLE_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

function isValidAliasValue(alias: string): boolean {
  return alias === "" || SIMPLE_IDENTIFIER.test(alias);
}

function lastDotSegment(namespace: string): string {
  const lastDot = namespace.lastIndexOf(".");
  return lastDot < 0 ? namespace : namespace.slice(lastDot + 1);
}

/**
 * Resolves every namespace's *effective* alias from the three sources `odata2ts-namespace-alias.md`
 * describes, in fixed precedence: a server-declared `<Schema Alias="...">` (`rawNamespaces`' own alias
 * slot) always wins, a project-configured `namespace.alias` fills whatever the server left unaliased, and
 * odata2ts synthesizes its own guess - the namespace's last dot-segment - for whatever both leave a gap,
 * unless `disableAutoAlias` turns that off.
 *
 * Returns one flat map from real namespace to effective alias, covering only the namespaces that end up
 * with one - the single already-merged table every consumer (`DataModel.namespace2Alias`,
 * `ServiceConfigHelper`'s per-call `NamespaceWithAlias` tuples, `NamingHelper.getFolderPath`,
 * `DataModel.getDisplayFqName`) reads from, so none of them need to know which of the three sources
 * actually supplied a given value.
 *
 * Throws where a project setting is unambiguously wrong (an alias for an unknown or already-aliased
 * namespace, an alias that isn't a valid CSDL `SimpleIdentifier`) or would silently collapse two namespaces
 * onto the same alias. A synthesized alias that would collide is instead dropped without error: nobody
 * asked for it, so it must never be able to break a build the way a rejected explicit setting legitimately
 * can - see the spec's "Auto-synthesis" section.
 */
export function resolveNamespaceAliases(
  rawNamespaces: ReadonlyArray<NamespaceWithAlias>,
  options: Pick<NamespaceOptions, "alias" | "disableAutoAlias"> | undefined,
): Record<string, string> {
  const allNamespaces = rawNamespaces.map(([ns]) => ns);
  const namespaceSet = new Set(allNamespaces);

  const serverAlias = new Map<string, string>();
  for (const [ns, alias] of rawNamespaces) {
    if (alias) {
      serverAlias.set(ns, alias);
    }
  }

  const configuredAlias = options?.alias ?? {};
  for (const [ns, alias] of Object.entries(configuredAlias)) {
    if (!namespaceSet.has(ns)) {
      throw new Error(
        `namespace.alias configures an alias for namespace "${ns}", but the digested metadata does not contain that namespace!`,
      );
    }
    if (serverAlias.has(ns)) {
      throw new Error(
        `namespace.alias configures an alias for namespace "${ns}", but the server already declares alias ` +
          `"${serverAlias.get(ns)}" for it - remove the configured entry, the server's own alias always wins.`,
      );
    }
    if (!isValidAliasValue(alias)) {
      throw new Error(
        `namespace.alias for namespace "${ns}" is not a valid alias: "${alias}" is neither the empty string ` +
          `nor a valid CSDL SimpleIdentifier.`,
      );
    }
  }

  // server-declared and project-configured are both deliberate settings, validated identically from here on
  const authoritative = new Map<string, string>([...serverAlias, ...Object.entries(configuredAlias)]);

  const authoritativeOwnersByAlias = new Map<string, Array<string>>();
  for (const [ns, alias] of authoritative) {
    const owners = authoritativeOwnersByAlias.get(alias) ?? [];
    owners.push(ns);
    authoritativeOwnersByAlias.set(alias, owners);
  }
  for (const [alias, owners] of authoritativeOwnersByAlias) {
    if (owners.length > 1) {
      throw new Error(
        `Namespaces ${owners.map((ns) => `"${ns}"`).join(" and ")} both resolve to the same alias "${alias}" - ` +
          `a server-declared or project-configured alias must be unique across the whole service.`,
      );
    }
  }
  for (const [ns, alias] of authoritative) {
    if (alias !== ns && namespaceSet.has(alias)) {
      throw new Error(
        `The alias "${alias}" declared/configured for namespace "${ns}" is itself the real name of another ` +
          `namespace in this service - alias values must be unique from every real namespace name.`,
      );
    }
  }

  const effective = new Map<string, string>(authoritative);

  if (!options?.disableAutoAlias) {
    const candidateOwnersByAlias = new Map<string, Array<string>>();
    for (const ns of allNamespaces) {
      if (effective.has(ns)) {
        continue;
      }
      const candidate = lastDotSegment(ns);
      const collides =
        [...effective.values()].includes(candidate) ||
        allNamespaces.some((other) => other !== ns && other === candidate);
      if (collides) {
        continue;
      }
      const owners = candidateOwnersByAlias.get(candidate) ?? [];
      owners.push(ns);
      candidateOwnersByAlias.set(candidate, owners);
    }
    for (const [candidate, owners] of candidateOwnersByAlias) {
      // 2+ namespaces synthesizing to the identical candidate is exactly the kind of collision auto-synthesis
      // must never force a choice between - drop the candidate for all of them rather than pick a winner
      if (owners.length === 1) {
        effective.set(owners[0], candidate);
      }
    }
  }

  return Object.fromEntries(effective);
}
