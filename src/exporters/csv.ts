import { DatabaseContext } from '../core/types';

function escapeCSV(value: any): string {
  if (value === null || value === undefined) return '';
  
  const stringValue = String(value);
  
  // Wrap in quotes if it contains comma, newline or double quote
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

export function toCSV(data: DatabaseContext): Record<string, string> {
  const output: Record<string, string> = {};

  for (const [tableName, rows] of Object.entries(data)) {
    if (rows.length === 0) {
      output[tableName] = '';
      continue;
    }

    const headers = Object.keys(rows[0]);
    const headerLine = headers.join(',');

    const rowLines = rows.map(row => {
      return headers.map(header => escapeCSV(row[header])).join(',');
    });

    output[tableName] = [headerLine, ...rowLines].join('\n');
  }

  return output;
}