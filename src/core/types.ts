/**
 * Represents the current state of the generated database holding all tables and rows.
 * Example: { 'users': [{...}], 'posts': [{...}] }
 */
export type DatabaseContext = Record<string, any[]>;

/**
 * Describes how a specific field is generated and its dependencies.
 */
export interface FieldDescriptor<T = any> {
  type: 'scalar' | 'relation';
  /** List of table names this field depends on. */
  dependencies: string[];
  /** Function to generate the field value based on the current context. */
  generate: (ctx: DatabaseContext) => T;
}

/**
 * Defines the schema for a single table, mapping field names to generators.
 */
export type SchemaDefinition = Record<string, FieldDescriptor>;

/**
 * Configuration for a single table including row count and schema.
 */
export interface TableConfig {
  count: number;
  schema: SchemaDefinition;
}

/**
 * The main configuration object mapping table names to their settings.
 */
export type FakerConfig = Record<string, TableConfig>;