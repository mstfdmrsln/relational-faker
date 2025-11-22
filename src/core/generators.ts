import { faker } from '@faker-js/faker';
import { FieldDescriptor, DatabaseContext } from './types';

export const f = {
  // --- Scalar Generators ---
  
  uuid: (): FieldDescriptor<string> => ({
    type: 'scalar',
    dependencies: [],
    generate: () => faker.string.uuid(),
  }),

  fullName: (): FieldDescriptor<string> => ({
    type: 'scalar',
    dependencies: [],
    generate: () => faker.person.fullName(),
  }),

  email: (): FieldDescriptor<string> => ({
    type: 'scalar',
    dependencies: [],
    generate: () => faker.internet.email(),
  }),

  boolean: (): FieldDescriptor<boolean> => ({
    type: 'scalar',
    dependencies: [],
    generate: () => faker.datatype.boolean(),
  }),
  
  /**
   * Allows providing a custom generation function.
   */
  custom: <T>(fn: () => T): FieldDescriptor<T> => ({
    type: 'scalar',
    dependencies: [],
    generate: () => fn(),
  }),

  // --- Relational Generators ---

  /**
   * Creates a foreign key reference to another table.
   * @param tableName The name of the target table.
   * @param field The field to select from the target record (default: 'id').
   */
  relation: (tableName: string, field: string = 'id'): FieldDescriptor<any> => ({
    type: 'relation',
    dependencies: [tableName], 
    generate: (ctx: DatabaseContext) => {
      const targetData = ctx[tableName];
      
      if (!targetData || targetData.length === 0) {
        throw new Error(`[RelationalFaker] Integrity Error: Table '${tableName}' is empty. Order resolution failed.`);
      }

      // Performance Note: Can be optimized with O(1) lookup tables for large datasets.
      const randomRecord = faker.helpers.arrayElement(targetData);
      
      if (!(field in randomRecord)) {
         throw new Error(`[RelationalFaker] Schema Error: Field '${field}' does not exist in table '${tableName}'.`);
      }
      
      return randomRecord[field];
    },
  }),
};