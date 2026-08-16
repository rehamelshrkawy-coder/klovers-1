import { describe, it, expect } from "vitest";
import { translations } from "@/i18n/translations";

/**
 * Locale parity.
 *
 * The translation layer is the strongest part of this codebase — ~1,800 keys
 * per locale, no placeholder values — and it stays that way only if a missing
 * key fails the build rather than silently rendering the key name to a student.
 */

type Node = unknown;

function leafPaths(node: Node, prefix = ""): string[] {
  if (node === null || typeof node !== "object") return [prefix];
  if (Array.isArray(node)) return node.flatMap((v, i) => leafPaths(v, `${prefix}[${i}]`));
  return Object.entries(node as Record<string, Node>).flatMap(([k, v]) =>
    leafPaths(v, prefix ? `${prefix}.${k}` : k),
  );
}

/**
 * Arabic has six CLDR plural categories and English has two, so a plural object
 * legitimately carries keys the other locale does not. Nothing else does.
 */
const ARABIC_ONLY_PLURAL_CATEGORIES = /\.(zero|two|few|many)$/;

/**
 * Any leaf inside a plural object. These are exempt from the placeholder check
 * because Arabic names small numbers lexically — the singular is "يوم واحد"
 * and the dual "يومان", neither of which interpolates a count the way the
 * English "{count} day" does. That asymmetry is the point of having six forms.
 */
const PLURAL_CATEGORY = /\.(zero|one|two|few|many|other)$/;

const en = new Set(leafPaths(translations.en));
const ar = new Set(leafPaths(translations.ar));

describe("translation parity", () => {
  it("has every English key in Arabic", () => {
    expect([...en].filter((k) => !ar.has(k))).toEqual([]);
  });

  it("has every Arabic key in English, plural categories aside", () => {
    const extra = [...ar].filter((k) => !en.has(k) && !ARABIC_ONLY_PLURAL_CATEGORIES.test(k));
    expect(extra).toEqual([]);
  });

  it("ships no empty or placeholder values", () => {
    const offenders: string[] = [];
    for (const [locale, tree] of Object.entries(translations)) {
      const walk = (node: Node, path: string) => {
        if (typeof node === "string") {
          if (node.trim() === "" || /^(TODO|TBD|FIXME|XXX)\b/i.test(node.trim())) {
            offenders.push(`${locale}.${path}`);
          }
          return;
        }
        if (node && typeof node === "object") {
          if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`));
          else for (const [k, v] of Object.entries(node as Record<string, Node>)) {
            walk(v, path ? `${path}.${k}` : k);
          }
        }
      };
      walk(tree, "");
    }
    expect(offenders).toEqual([]);
  });

  it("uses the same interpolation placeholders in both locales", () => {
    const placeholders = (s: string) =>
      [...s.matchAll(/\{\{?(\w+)\}?\}/g)].map((m) => m[1]).sort();
    const get = (tree: Node, path: string): Node =>
      path.split(/\.|\[|\]/).filter(Boolean).reduce<Node>(
        (acc, k) => (acc == null ? acc : (acc as Record<string, Node>)[k]),
        tree,
      );

    const mismatches: string[] = [];
    for (const path of en) {
      if (PLURAL_CATEGORY.test(path)) continue;
      const a = get(translations.en, path);
      const b = get(translations.ar, path);
      if (typeof a !== "string" || typeof b !== "string") continue;
      const pa = placeholders(a);
      const pb = placeholders(b);
      if (pa.join(",") !== pb.join(",")) mismatches.push(`${path}: en[${pa}] vs ar[${pb}]`);
    }
    expect(mismatches).toEqual([]);
  });
});
