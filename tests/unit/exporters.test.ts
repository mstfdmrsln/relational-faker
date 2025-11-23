import { describe, it, expect } from 'vitest';
import { toSQL } from '../../src/exporters/sql';
import { toCSV } from '../../src/exporters/csv';

const mockData = {
  users: [
    { id: 1, name: "John O'Connor", active: true, createdAt: new Date('2023-01-01T00:00:00.000Z') },
    { id: 2, name: 'Alice', active: false, createdAt: null }
  ]
};

describe('Exporters', () => {
  
  describe('toSQL', () => {
    it('should generate valid INSERT statements', () => {
      const sql = toSQL(mockData, { dialect: 'postgres' });
      
      expect(sql).toContain('INSERT INTO "users" ("id", "name", "active", "createdAt") VALUES');
      // Verify single quote escaping (O'Connor -> O''Connor)
      expect(sql).toContain("'John O''Connor'"); 
      // Verify boolean formatting
      expect(sql).toContain('TRUE');
      // Verify date formatting
      expect(sql).toContain("'2023-01-01T00:00:00.000Z'");
      // Verify null handling
      expect(sql).toContain('NULL');
    });
  });

  describe('toCSV', () => {
    it('should generate valid CSV strings per table', () => {
      const csv = toCSV(mockData);
      
      expect(csv).toHaveProperty('users');
      const lines = csv.users.split('\n');
      
      // Verify Header
      expect(lines[0]).toBe('id,name,active,createdAt');
      
      // Verify Row 1 (Special char handling)
      expect(lines[1]).toContain('John O\'Connor');
      
      // Verify Row 2 (Null handling)
      // Since the last column is null, the row ends with a comma (e.g., "val1,val2,")
      expect(lines[2]).toBe('2,Alice,false,'); 
    });

    it('should escape commas in CSV', () => {
      const trickyData = {
        items: [{ id: 1, description: 'Hello, world' }]
      };
      const csv = toCSV(trickyData);
      
      // Strings containing commas must be wrapped in quotes
      expect(csv.items).toContain('"Hello, world"');
    });
  });
});