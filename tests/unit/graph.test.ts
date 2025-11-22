// tests/unit/graph.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { DependencyGraph } from '../../src/core/graph';

describe('DependencyGraph (Topological Sort)', () => {
  let graph: DependencyGraph;

  beforeEach(() => {
    graph = new DependencyGraph();
  });

  it('should resolve simple linear dependencies (A -> B)', () => {
    // B depends on A
    graph.addDependency('B', 'A'); 
    
    const order = graph.resolveOrder();
    
    // A must come before B
    expect(order).toEqual(['A', 'B']);
  });

  it('should resolve complex chain dependencies (A -> B -> C)', () => {
    graph.addDependency('C', 'B');
    graph.addDependency('B', 'A');

    const order = graph.resolveOrder();
    expect(order).toEqual(['A', 'B', 'C']);
  });

  it('should resolve diamond dependencies correctly', () => {
    // Structure: A -> B, A -> C, then (B & C) -> D
    graph.addDependency('B', 'A');
    graph.addDependency('C', 'A');
    graph.addDependency('D', 'B');
    graph.addDependency('D', 'C');

    const order = graph.resolveOrder();

    // A must be first, D must be last. B and C are in the middle.
    expect(order[0]).toBe('A');
    expect(order[3]).toBe('D');
    expect(order).toContain('B');
    expect(order).toContain('C');
  });

  it('should detect circular dependencies and throw error', () => {
    // Cycle: A -> B -> A
    graph.addDependency('B', 'A');
    graph.addDependency('A', 'B');

    expect(() => graph.resolveOrder()).toThrowError(/Circular dependency/);
  });

  it('should handle disconnected graphs', () => {
    // Two independent groups: A -> B and X -> Y
    graph.addDependency('B', 'A');
    graph.addDependency('Y', 'X');

    const order = graph.resolveOrder();
    
    // All nodes must be present
    expect(order).toHaveLength(4);
    // Order rules must be respected within groups
    expect(order.indexOf('A')).toBeLessThan(order.indexOf('B'));
    expect(order.indexOf('X')).toBeLessThan(order.indexOf('Y'));
  });
});