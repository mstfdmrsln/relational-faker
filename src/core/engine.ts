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

  public seed(value: number) {
    faker.seed(value);
  }

  private buildExecutionPlan() {
    Object.keys(this.config).forEach((tableName) => {
      this.graph.addNode(tableName);
      const schema = this.config[tableName].schema;

      Object.values(schema).forEach((descriptor) => {
        descriptor.dependencies.forEach((dep) => {
          // Ignore self-references in the dependency graph to prevent circular errors.
          // Self-referencing logic is handled during the generation phase.
          if (dep !== tableName) { 
            this.graph.addDependency(tableName, dep);
          }
        });
      });
    });
  }

  public generate(): DatabaseContext {
    const executionOrder = this.graph.resolveOrder();
    const db: DatabaseContext = {};

    for (const tableName of executionOrder) {
      if (!this.config[tableName]) continue;

      const { count, schema } = this.config[tableName];
      const tableRows: any[] = []; 

      for (let i = 0; i < count; i++) {
        const row: Record<string, any> = {};
        
        // Construct the context with access to previous tables, current batch, and current row.
        const context = {
          db,           
          store: tableRows, 
          row: row       
        };

        for (const [fieldName, descriptor] of Object.entries(schema)) {
          row[fieldName] = descriptor.generate(context);
        }
        
        tableRows.push(row);
      }

      db[tableName] = tableRows;
    }

    return db;
  }
}