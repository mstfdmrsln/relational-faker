import { faker } from '@faker-js/faker';
import { FieldDescriptor, GeneratorContext } from './types';

export const f = {
  // --- Scalars ---
  
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
  
  custom: <T>(fn: (ctx: GeneratorContext) => T): FieldDescriptor<T> => ({
    type: 'scalar',
    dependencies: [],
    generate: (ctx) => fn(ctx),
  }),

  // --- Relational & Smart Generators ---

  /**
   * Creates a relation to another table or the same table (self-reference).
   */
  relation: (tableName: string, field: string = 'id'): FieldDescriptor<any> => ({
    type: 'relation',
    dependencies: [tableName],
    generate: ({ db, store }) => {
      let targetData: any[] = [];

      // Check if we are referencing the table currently being generated (Self-Reference)
      const isSelfReference = !db[tableName]; 
      
      if (isSelfReference) {
        targetData = store;
        // If it's the first row, there are no parents to pick from yet.
        if (targetData.length === 0) return null; 
      } else {
        targetData = db[tableName];
      }

      if (!targetData || targetData.length === 0) {
        if (!isSelfReference) {
             throw new Error(`[RelationalFaker] Error: Table '${tableName}' is empty.`);
        }
        return null;
      }

      const randomRecord = faker.helpers.arrayElement(targetData);

      // --- FIX: Validation Check Added Back ---
      // We must ensure the referenced field actually exists in the target record.
      if (!(field in randomRecord)) {
        throw new Error(`[RelationalFaker] Schema Error: Field '${field}' does not exist in table '${tableName}'.`);
      }
      // ----------------------------------------

      return randomRecord[field];
    },
  }),

  /**
   * Date generators with context awareness.
   */
  date: {
    past: (): FieldDescriptor<Date> => ({
        type: 'scalar', dependencies: [],
        generate: () => faker.date.past()
    }),
    
    /**
     * Generates a date relative to another field in the same row.
     * Useful for ensuring 'updatedAt' > 'createdAt'.
     */
    soon: (days: number, refField?: string): FieldDescriptor<Date> => ({
        type: 'scalar', dependencies: [],
        generate: ({ row }) => {
            let refDate = new Date();
            if (refField && row[refField]) {
                refDate = new Date(row[refField]);
            }
            return faker.date.soon({ days, refDate });
        }
    })
  }
};