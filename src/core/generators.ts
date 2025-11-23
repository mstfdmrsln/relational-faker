import { faker } from '@faker-js/faker';
import { FieldDescriptor, GeneratorContext } from './types';

// --- MANY-TO-MANY HELPER ---

/**
 * Creates a synchronized pair of generators to create unique Many-to-Many relationships.
 * It calculates the Cartesian Product of two tables, shuffles it, and yields unique pairs.
 * * @param tableA Name of the first table
 * @param tableB Name of the second table
 * @param fieldA Field from tableA to join (default: id)
 * @param fieldB Field from tableB to join (default: id)
 */
export const crossJoin = (
  tableA: string,
  tableB: string,
  fieldA: string = 'id',
  fieldB: string = 'id'
) => {
  // Shared state via closure
  const state = {
    initialized: false,
    pool: [] as [any, any][], // Shuffled unique pairs
    currentPair: null as [any, any, any] | null, // [valA, valB, rowReference]
    index: 0
  };

  const initPool = (db: any) => {
    if (state.initialized) return;

    const dataA = db[tableA];
    const dataB = db[tableB];

    if (!dataA || !dataB) {
      throw new Error(`[RelationalFaker] CrossJoin Error: Tables '${tableA}' and '${tableB}' must be generated before the join table.`);
    }

    // Cartesian Product
    for (const rowA of dataA) {
      for (const rowB of dataB) {
        state.pool.push([rowA[fieldA], rowB[fieldB]]);
      }
    }

    faker.helpers.shuffle(state.pool);
    state.initialized = true;
  };

  const getNextPair = (db: any) => {
    if (state.index >= state.pool.length) {
       throw new Error(`[RelationalFaker] Exhausted unique pairs between '${tableA}' and '${tableB}'. Increase source data count or decrease join table count.`);
    }
    return state.pool[state.index];
  };

  // Left Generator
  const left: FieldDescriptor<any> = {
    type: 'relation',
    dependencies: [tableA, tableB],
    generate: ({ db, row }) => {
      initPool(db);
      
      // If we moved to a new row, reset current pair selection
      if (state.currentPair && state.currentPair[2] !== row) {
         state.currentPair = null;
      }

      if (!state.currentPair) {
        const pair = getNextPair(db);
        state.currentPair = [pair[0], pair[1], row]; 
        state.index++;
      }

      return state.currentPair[0];
    }
  };

  // Right Generator
  const right: FieldDescriptor<any> = {
    type: 'relation',
    dependencies: [tableA, tableB],
    generate: ({ db, row }) => {
      initPool(db);

      if (state.currentPair && state.currentPair[2] !== row) {
         state.currentPair = null;
      }

      if (!state.currentPair) {
        const pair = getNextPair(db);
        state.currentPair = [pair[0], pair[1], row];
        state.index++;
      }

      return state.currentPair[1];
    }
  };

  return { left, right };
};

// --- STANDARD GENERATORS ---

export const f = {
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
   * Allows custom generation logic with access to the full context (db, store, row).
   */
  custom: <T>(fn: (ctx: GeneratorContext) => T): FieldDescriptor<T> => ({
    type: 'scalar',
    dependencies: [],
    generate: (ctx) => fn(ctx),
  }),

  /**
   * Creates a foreign key reference. Handles self-references automatically.
   */
  relation: (tableName: string, field: string = 'id'): FieldDescriptor<any> => ({
    type: 'relation',
    dependencies: [tableName],
    generate: ({ db, store }) => {
      let targetData: any[] = [];
      const isSelfReference = !db[tableName]; 
      
      if (isSelfReference) {
        targetData = store;
        // First row of a self-referencing table has no predecessors
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

      if (!(field in randomRecord)) {
        throw new Error(`[RelationalFaker] Schema Error: Field '${field}' does not exist in table '${tableName}'.`);
      }

      return randomRecord[field];
    },
  }),

  date: {
    past: (): FieldDescriptor<Date> => ({
        type: 'scalar', dependencies: [],
        generate: () => faker.date.past()
    }),
    
    /**
     * Generates a date relative to another field (e.g. updatedAt > createdAt).
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