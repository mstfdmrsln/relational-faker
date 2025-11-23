/**
 * Represents the current state of all fully generated tables.
 * Example: { users: [{ id: 1, ... }], posts: [...] }
 */
export type DatabaseContext = Record<string, any[]>;

/**
 * Context passed to every generator function.
 * Contains the global DB, the current batch being generated, and the current row being mutated.
 */
export interface GeneratorContext {
  db: DatabaseContext;       
  store: any[];             
  row: Record<string, any>;  
}

/**
 * Describes how a field is generated and tracks its dependencies.
 */
export interface FieldDescriptor<T = any> {
  type: 'scalar' | 'relation';
  dependencies: string[];
  generate: (ctx: GeneratorContext) => T;
}

export type SchemaDefinition = Record<string, FieldDescriptor>;

export interface TableConfig {
  count: number;
  schema: SchemaDefinition;
}

export type FakerConfig = Record<string, TableConfig>;