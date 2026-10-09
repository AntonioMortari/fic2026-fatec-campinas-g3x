// A spreadsheet runs a cell that starts with one of these as a formula, and quotes do not stop it: it has to be neutralized.
const FORMULA_START = /^[=+\-@\t\r]/;

// Semicolon, because a spreadsheet in Brazilian Portuguese reads comma as the decimal mark and would pour the whole
// row into one column. The BOM is what makes it read the accents as UTF-8.
const DELIMITER = ';';
const BOM = '﻿';

export function csvCell(value: string | number | boolean | null | undefined): string {
  let text = value === null || value === undefined ? '' : String(value);
  if (FORMULA_START.test(text)) text = `'${text}`;
  return /[";\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(rows: (string | number | boolean | null | undefined)[][]): string {
  return BOM + rows.map((row) => row.map(csvCell).join(DELIMITER)).join('\r\n') + '\r\n';
}
