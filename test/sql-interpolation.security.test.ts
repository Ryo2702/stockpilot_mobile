import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@jest/globals";

const trustedSqlFragments = new Set([
  "activeStoreSql",
  'children.join(" OR ")',
  'columns.join(", ")',
  'columns.map(() => "?").join(", ")',
  'conditions.join(" AND ")',
  'expected.map(() => "?").join(", ")',
  "itemColumns",
  "key",
  "alias",
  "movementColumns",
  "orderBy[sort]",
  "orderBy",
  "ownerStoresQuery",
  "productColumn",
  "productsTable",
  "quantity",
  "quantitySql",
  "quoteSqlString(passphrase)",
  "schemaMigrationsSchema",
  "storeSettingsSchema",
  "storesIndexesSchema",
  "table",
  "tableName",
  'tableName === "stores" ? "IF NOT EXISTS " : ""',
  'triggerNames.map(() => "?").join(", ")',
  "where",
]);

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

function sqlInterpolationViolations(source: string) {
  const violations: string[] = [];
  for (const [, template] of source.matchAll(/`([^`]*\$\{[^`]*)`/gs)) {
    if (!/^\s*(?:SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|PRAGMA|ATTACH)\b/.test(template)) continue;
    for (const [, expression] of template.matchAll(/\$\{([^}]+)\}/g)) {
      const value = expression.trim();
      if (!trustedSqlFragments.has(value)) violations.push(value);
    }
  }
  return violations;
}

test("SQL template interpolation uses only fixed, reviewed fragments", () => {
  const violations = sourceFiles(join(__dirname, "../src")).flatMap((path) =>
    sqlInterpolationViolations(readFileSync(path, "utf8")).map((value) => `${path}: ${value}`),
  );
  expect(violations).toEqual([]);
});

test("SQL interpolation check detects values in query text", () => {
  expect(sqlInterpolationViolations("db.getFirstAsync(`SELECT * FROM products WHERE name = '${name}'`)")).toEqual(["name"]);
});
