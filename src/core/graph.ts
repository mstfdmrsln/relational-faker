/**
 * Dependency Graph Manager.
 * Handles topological sorting and circular dependency detection.
 */
export class DependencyGraph {
  private adjList: Map<string, Set<string>> = new Map();
  private nodes: Set<string> = new Set();

  addNode(node: string) {
    this.nodes.add(node);
    if (!this.adjList.has(node)) {
      this.adjList.set(node, new Set());
    }
  }

  addDependency(dependent: string, dependency: string) {
    this.addNode(dependent);
    this.addNode(dependency);
    this.adjList.get(dependent)!.add(dependency);
  }

  /**
   * Resolves the execution order using Topological Sort (DFS).
   * @throws Error if a circular dependency is detected.
   */
  resolveOrder(): string[] {
    const visited = new Set<string>();
    const tempVisited = new Set<string>(); // Stack for cycle detection
    const order: string[] = [];

    const visit = (node: string) => {
      if (tempVisited.has(node)) {
        throw new Error(`[RelationalFaker] CRITICAL: Circular dependency detected involving '${node}'.`);
      }
      if (visited.has(node)) return;

      tempVisited.add(node);

      const deps = this.adjList.get(node);
      if (deps) {
        for (const dep of deps) {
          visit(dep);
        }
      }

      tempVisited.delete(node);
      visited.add(node);
      order.push(node);
    };

    for (const node of this.nodes) {
      if (!visited.has(node)) visit(node);
    }

    return order;
  }
}