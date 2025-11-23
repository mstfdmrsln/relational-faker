import { describe, it, expect } from 'vitest';
import { RelationalFaker } from '../../src/core/engine';
import { f } from '../../src/core/generators';

describe('RelationalFaker v1.1 Features', () => {

  describe('Self-Referencing Relations (Recursive)', () => {
    it('should handle self-referencing tables without circular dependency errors', () => {
      const mocker = new RelationalFaker({
        categories: {
          count: 10,
          schema: {
            id: f.uuid(),
            name: f.fullName(),
            // Self-reference: referencing the table being generated
            parentId: f.relation('categories', 'id'), 
          },
        },
      });

      // Should not throw "Circular dependency" error
      const data = mocker.generate();

      expect(data.categories).toHaveLength(10);

      // Validation:
      // 1. Root items must exist (parentId is null/undefined)
      // 2. Child items must point to an existing ID within the same batch
      const ids = new Set(data.categories.map((c: any) => c.id));
      
      data.categories.forEach((category: any) => {
        if (category.parentId) {
          expect(ids.has(category.parentId)).toBe(true);
        }
      });
    });

    it('should return null for the first generated row in a self-referencing table', () => {
      const mocker = new RelationalFaker({
        nodes: {
          count: 1,
          schema: {
            id: f.uuid(),
            parentId: f.relation('nodes', 'id'),
          },
        },
      });

      mocker.seed(123);
      const data = mocker.generate();

      // The first row has no predecessors in the store, so it must be null
      expect(data.nodes[0].parentId).toBeNull();
    });
  });

  describe('Smart Constraints (Context Awareness)', () => {
    it('should allow accessing current row data within generators', () => {
      const mocker = new RelationalFaker({
        items: {
          count: 5,
          schema: {
            basePrice: f.custom(() => 100),
            // Custom generator accessing the 'row' property
            tax: f.custom(({ row }) => row.basePrice * 0.2), 
            total: f.custom(({ row }) => row.basePrice + (row.basePrice * 0.2)),
          },
        },
      });

      const data = mocker.generate();

      data.items.forEach((item: any) => {
        expect(item.basePrice).toBe(100);
        expect(item.tax).toBe(20);
        expect(item.total).toBe(120);
      });
    });

    it('should generate valid dates based on reference fields (f.date.soon)', () => {
      const mocker = new RelationalFaker({
        tasks: {
          count: 50,
          schema: {
            createdAt: f.date.past(),
            // updated_at must be after created_at
            updatedAt: f.date.soon(10, 'createdAt'), 
          },
        },
      });

      const data = mocker.generate();

      data.tasks.forEach((task: any) => {
        const created = new Date(task.createdAt).getTime();
        const updated = new Date(task.updatedAt).getTime();
        
        expect(updated).toBeGreaterThanOrEqual(created);
      });
    });
  });

  describe('Complex Interdependent Scenarios', () => {
    it('should maintain referential integrity in mixed scenarios', () => {
      const mocker = new RelationalFaker({
        users: {
          count: 2,
          schema: { id: f.uuid() }
        },
        posts: {
          count: 5,
          schema: {
            id: f.uuid(),
            authorId: f.relation('users', 'id'),
            // Self-reference (Threaded comments simulation)
            parentPostId: f.relation('posts', 'id') 
          }
        }
      });

      const data = mocker.generate();
      const userIds = data.users.map((u: any) => u.id);
      const postIds = new Set(data.posts.map((p: any) => p.id));

      data.posts.forEach((post: any) => {
        // Check external relation
        expect(userIds).toContain(post.authorId);
        
        // Check self relation (if exists)
        if (post.parentPostId) {
          expect(postIds.has(post.parentPostId)).toBe(true);
        }
      });
    });
  });
});