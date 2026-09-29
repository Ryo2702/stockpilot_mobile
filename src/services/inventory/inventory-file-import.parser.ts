import { unzipSync } from "fflate";
import * as XLSX from "xlsx";

import { parseCsvRecords } from "./inventory-import.service";
import {
  inventoryFileImportFieldLabels,
  supportedInventoryFileExtensions,
  type InventoryFileImportField,
  type InventoryFileImportFieldMapping,
  type InventoryFileImportProduct,
  type InventoryFileImportSource,
  type InventoryFileImportSourceRecord,
  type InventoryFileType,
  type ParsedInventoryFile,
} from "./inventory-file-import.types";

const fieldAliases: Record<Exclude<InventoryFileImportField, "ignore">, string[]> = {
  name: ["name", "product", "product name", "item", "item name", "description"],
  quantity: ["qty", "quantity", "stock", "stock quantity", "units", "on hand"],
  costPrice: ["cost", "cost price", "purchase price", "buying price", "unit cost"],
  sellingPrice: ["price", "selling price", "retail", "retail price", "current price", "sale price"],
  sku: ["sku", "code", "item code", "product code"],
  barcode: ["barcode", "ean", "upc", "gtin"],
  category: ["category", "type", "product category"],
  unit: ["unit", "uom", "unit of measure"],
};

const positionalFields: InventoryFileImportField[] = [
  "name",
  "quantity",
  "costPrice",
  "sellingPrice",
  "sku",
  "barcode",
  "category",
  "unit",
];

// ponytail: 10 MB input ceiling; use streaming parsers if imports need to exceed it.
export const maxInventoryFileImportBytes = 10 * 1024 * 1024;

export function getInventoryFileType(fileName: string): InventoryFileType {
  const extension = fileName.trim().split(".").pop()?.toLowerCase();
  if (!extension || !supportedInventoryFileExtensions.includes(extension as InventoryFileType)) {
    throw new Error("Choose an XLSX, XLS, DOCX, TXT, or CSV inventory file.");
  }
  return extension as InventoryFileType;
}

export function normalizeInventoryFileValue(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function cleanValue(value: unknown) {
  return String(value ?? "").replace(/\u00a0/g, " ").trim();
}

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function textFromXml(xml: string) {
  return decodeEntities(
    xml
      .replace(/<w:tab\b[^>]*\/>/g, "\t")
      .replace(/<w:br\b[^>]*\/>/g, "\n")
      .replace(/<w:t\b[^>]*>/g, "")
      .replace(/<\/w:t>/g, "")
      .replace(/<[^>]+>/g, ""),
  ).replace(/\s+/g, " ").trim();
}

function splitPlainRows(text: string, delimiter: "\t" | "|") {
  return text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.split(delimiter).map(cleanValue))
    .filter((row) => row.some(Boolean));
}

function looksLikeProductRow(row: string[]) {
  return Boolean(row[0]?.trim()) && row.slice(1).some((value) => /^[-+]?\d+(?:[,.]\d+)?$/.test(value.trim()));
}

function positionalColumns(length: number) {
  return positionalFields
    .map((field) => inventoryFileImportFieldLabels[field])
    .slice(0, Math.max(2, length));
}

function documentFromRecords(records: string[][]): ParsedInventoryFile {
  const nonEmpty = records.filter((row) => row.some((value) => cleanValue(value)));
  if (!nonEmpty.length) throw new Error("This file is empty.");

  const first = nonEmpty[0].map(cleanValue);
  if (looksLikeProductRow(first)) {
    return {
      columns: positionalColumns(first.length),
      records: nonEmpty.map((row) => row.map(cleanValue)),
      positional: true,
    };
  }
  if (nonEmpty.length < 2) throw new Error("StockPilot could not identify inventory information in this document.");
  return {
    columns: first.map((value, index) => value || `Column ${index + 1}`),
    records: nonEmpty.slice(1).map((row) => row.map(cleanValue)),
    positional: false,
  };
}

function fieldForLabel(label: string): InventoryFileImportField {
  const normalized = normalizeInventoryFileValue(label).replace(/[_-]/g, " ");
  for (const [field, aliases] of Object.entries(fieldAliases) as Array<
    [Exclude<InventoryFileImportField, "ignore">, string[]]
  >) {
    if (aliases.includes(normalized)) return field;
  }
  return "ignore";
}

export function createInitialInventoryFileImportMapping(
  columns: string[],
  positional: boolean,
): InventoryFileImportFieldMapping[] {
  return columns.map((label, column) => ({
    column,
    label,
    field: positional ? positionalFields[column] ?? "ignore" : fieldForLabel(label),
  }));
}

export function inventoryFileImportMappingNeedsReview(mapping: InventoryFileImportFieldMapping[]) {
  const fields = new Set(mapping.map(({ field }) => field));
  return !fields.has("name") || !fields.has("quantity");
}

function parseLabeledText(text: string): ParsedInventoryFile | null {
  const records: Array<Record<string, string>> = [];
  let record: Record<string, string> = {};
  for (const line of text.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const match = line.match(/^\s*([^:]+):\s*(.+?)\s*$/);
    if (!match) continue;
    const field = fieldForLabel(match[1]);
    if (field === "ignore") continue;
    if (field === "name" && record.name) {
      records.push(record);
      record = {};
    }
    record[field] = cleanValue(match[2]);
  }
  if (record.name) records.push(record);
  if (!records.some((entry) => entry.name && entry.quantity)) return null;

  return {
    columns: positionalFields.map((field) => inventoryFileImportFieldLabels[field]),
    records: records.map((entry) => positionalFields.map((field) => entry[field] ?? "")),
    positional: true,
  };
}

function parseTextDocument(text: string): ParsedInventoryFile {
  if (!text.trim()) throw new Error("This text document is empty.");
  const csv = parseCsvRecords(text);
  if (csv.length > 1 && csv.some((row) => row.length > 1)) return documentFromRecords(csv);

  const tabRows = splitPlainRows(text, "\t");
  if (tabRows.length > 1 && tabRows.some((row) => row.length > 1)) return documentFromRecords(tabRows);

  const pipeRows = splitPlainRows(text, "|");
  if (pipeRows.length > 0 && pipeRows.some((row) => row.length > 1)) return documentFromRecords(pipeRows);

  const labeled = parseLabeledText(text);
  if (labeled) return labeled;
  throw new Error("StockPilot could not identify inventory information in this document.");
}

function parseDocxDocument(bytes: Uint8Array): ParsedInventoryFile {
  let xml: string;
  try {
    const contents = unzipSync(bytes);
    const document = contents["word/document.xml"];
    if (!document) throw new Error("missing document");
    xml = new TextDecoder().decode(document);
  } catch {
    throw new Error("This DOCX file is corrupted or could not be opened.");
  }

  const tableRows = [...xml.matchAll(/<w:tr\b[\s\S]*?<\/w:tr>/g)]
    .map(([row]) => [...row.matchAll(/<w:tc\b[\s\S]*?<\/w:tc>/g)].map(([cell]) => textFromXml(cell)))
    .filter((row) => row.some(Boolean));
  if (tableRows.length && tableRows.some((row) => row.length > 1)) return documentFromRecords(tableRows);

  const paragraphs = [...xml.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)]
    .map(([paragraph]) => textFromXml(paragraph))
    .filter(Boolean)
    .join("\n");
  return parseTextDocument(paragraphs);
}

function spreadsheetDocumentFromRows(rows: unknown[][]) {
  const nonEmpty = rows
    .map((row) => row.map(cleanValue))
    .filter((row) => row.some(Boolean));
  if (!nonEmpty.length) return null;

  for (let index = 0; index < Math.min(nonEmpty.length - 1, 30); index += 1) {
    const columns = nonEmpty[index].map((value, column) => value || `Column ${column + 1}`);
    if (inventoryFileImportMappingNeedsReview(createInitialInventoryFileImportMapping(columns, false))) continue;
    return { columns, records: nonEmpty.slice(index + 1), positional: false } satisfies ParsedInventoryFile;
  }

  try {
    return documentFromRecords(nonEmpty);
  } catch {
    return null;
  }
}

function parseSpreadsheetDocument(bytes: Uint8Array): ParsedInventoryFile {
  try {
    const workbook = XLSX.read(bytes, { type: "array", raw: false });
    let fallback: ParsedInventoryFile | null = null;
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", blankrows: false }) as unknown[][];
      const parsed = spreadsheetDocumentFromRows(rows);
      if (!parsed?.records.length) continue;
      if (!inventoryFileImportMappingNeedsReview(createInitialInventoryFileImportMapping(parsed.columns, parsed.positional))) {
        return parsed;
      }
      fallback ??= parsed;
    }
    if (fallback) return fallback;
    throw new Error("missing inventory sheet");
  } catch {
    throw new Error("Unable to read this spreadsheet. It may be corrupted or use an unsupported structure.");
  }
}

export function parseInventoryFileSource(
  source: InventoryFileImportSource,
  fileType: InventoryFileType,
): ParsedInventoryFile {
  if (fileType === "xlsx" || fileType === "xls") {
    if (typeof source.content === "string") throw new Error("Unable to read this spreadsheet.");
    return parseSpreadsheetDocument(source.content);
  }
  if (fileType === "docx") {
    if (typeof source.content === "string") throw new Error("This DOCX file could not be opened.");
    return parseDocxDocument(source.content);
  }
  const text = typeof source.content === "string" ? source.content : new TextDecoder().decode(source.content);
  return parseTextDocument(text);
}

export function createInventoryFileImportRows(
  records: InventoryFileImportSourceRecord[],
  mapping: InventoryFileImportFieldMapping[],
): InventoryFileImportProduct[] {
  const columnFor = (field: InventoryFileImportField) => mapping.find((entry) => entry.field === field)?.column;
  const valueAt = (record: InventoryFileImportSourceRecord, field: InventoryFileImportField) => {
    const column = columnFor(field);
    return column === undefined ? "" : cleanValue(record.values[column]);
  };
  return records.map((record) => ({
    id: record.id,
    rowNumber: record.rowNumber,
    name: valueAt(record, "name"),
    sku: valueAt(record, "sku"),
    barcode: valueAt(record, "barcode"),
    quantity: valueAt(record, "quantity"),
    costPrice: valueAt(record, "costPrice"),
    sellingPrice: valueAt(record, "sellingPrice"),
    category: valueAt(record, "category"),
    unit: valueAt(record, "unit"),
    status: "needs_review",
    issues: [],
    existing: null,
    approveExisting: false,
    canImport: false,
  }));
}
