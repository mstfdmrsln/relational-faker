import { DatabaseContext } from '../core/types';

type SQLDialect = 'postgres' | 'mysql' | 'sqlite';

interface SQLExportOptions {
  dialect?: SQLDialect;
}

/**
 * Converts a JavaScript value to a SQL-safe string.
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) return 'NULL';
  
  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }
  
  if (typeof value === 'number') {
    return value.toString();
  }
  
  if (value instanceof Date) {
    return `'${value.toISOString()}'`; // ISO format is generally safe
  }
  
  if (typeof value === 'object') {
    // JSON support for objects/arrays
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }

  // Escape single quotes for strings (Standard SQL escaping)
  return `'${String(value).replace(/'/g, "''")}'`;
}

export function toSQL(data: DatabaseContext, options: SQLExportOptions = {}): string {
  const { dialect = 'postgres' } = options;
  let sqlOutput = '';

  for (const [tableName, rows] of Object.entries(data)) {
    if (rows.length === 0) continue;

    // Extract headers from the first row
    const columns = Object.keys(rows[0]);
    
    // Dialect specific identifier quoting
    const q = dialect === 'mysql' ? '`' : '"'; 
    const columnStr = columns.map(c => `${q}${c}${q}`).join(', ');

    sqlOutput += `-- Table: ${tableName}\n`;
    
    rows.forEach(row => {
      const values = columns.map(col => formatValue(row[col])).join(', ');
      sqlOutput += `INSERT INTO ${q}${tableName}${q} (${columnStr}) VALUES (${values});\n`;
    });
    
    sqlOutput += '\n';
  }

  return sqlOutput;
}