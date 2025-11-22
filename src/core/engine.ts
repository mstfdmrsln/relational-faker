import { FakerConfig, DatabaseContext } from './types';
import { DependencyGraph } from './graph';
import { faker } from '@faker-js/faker';

export class RelationalFaker {
  private config: FakerConfig;
  private graph: DependencyGraph;

  constructor(config: FakerConfig) {
    this.config = config;
    this.graph = new DependencyGraph();
    this.buildExecutionPlan();
  }

  /**
   * Sets the random seed for deterministic data generation.
   * @param value The seed number.
   */
  public seed(value: number) {
    faker.seed(value);
  }

  /**
   * Scans the schema configuration and constructs the dependency graph.
   */
  private buildExecutionPlan() {
    Object.keys(this.config).forEach((tableName) => {
      this.graph.addNode(tableName);
      const schema = this.config[tableName].schema;

      Object.values(schema).forEach((descriptor) => {
        descriptor.dependencies.forEach((dep) => {
          // Exclude self-references to prevent false circular dependency errors
          if (dep !== tableName) {
            this.graph.addDependency(tableName, dep);
          }
        });
      });
    });
  }

  /**
   * Resolves the topological execution order and hydrates the database.
   * @returns The generated relational data.
   */
  public generate(): DatabaseContext {
    const executionOrder = this.graph.resolveOrder();
    const db: DatabaseContext = {};

    // Debug: console.log(`[RelationalFaker] Execution Order: ${executionOrder.join(' -> ')}`);

    for (const tableName of executionOrder) {
      // Skip nodes that exist in the graph but are missing in the config
      if (!this.config[tableName]) continue;

      const { count, schema } = this.config[tableName];
      const rows = [];

      for (let i = 0; i < count; i++) {
        const row: Record<string, any> = {};
        
        for (const [fieldName, descriptor] of Object.entries(schema)) {
          // Pass the current database context to the generator function
          row[fieldName] = descriptor.generate(db);
        }
        
        rows.push(row);
      }

      db[tableName] = rows;
    }

    return db;
  }
}