// tests/integration/engine.test.ts
import { describe, it, expect } from 'vitest';
import { RelationalFaker } from '../../src/core/engine';
import { f } from '../../src/core/generators';

describe('RelationalFaker Engine', () => {
  
  it('should generate data in correct order based on relations', () => {
    const mocker = new RelationalFaker({
      // Defined 'posts' BEFORE 'users' deliberately.
      // The engine must resolve the dependency order: Users -> Posts.
      posts: {
        count: 5,
        schema: {
          id: f.uuid(),
          authorId: f.relation('users', 'id'),
        },
      },
      users: {
        count: 2,
        schema: {
          id: f.uuid(),
          name: f.fullName(),
        },
      },
    });

    const data = mocker.generate();

    // 1. Verify data generation counts
    expect(data.users).toHaveLength(2);
    expect(data.posts).toHaveLength(5);

    // 2. Referential Integrity Check
    // Ensure every 'authorId' in posts actually exists in the 'users' table.
    const userIds = data.users.map((u: any) => u.id);
    
    data.posts.forEach((post: any) => {
      expect(userIds).toContain(post.authorId);
    });
  });

  it('should be deterministic when seeded', () => {
    // Same Configuration + Same Seed = Identical Output
    const config = {
      users: {
        count: 3,
        schema: { id: f.uuid(), name: f.fullName() }
      }
    };

    const instance1 = new RelationalFaker(config);
    instance1.seed(12345);
    const result1 = instance1.generate();

    const instance2 = new RelationalFaker(config);
    instance2.seed(12345);
    const result2 = instance2.generate();

    expect(result1).toEqual(result2);
  });

  it('should throw error if referenced table is empty', () => {
    const mocker = new RelationalFaker({
      users: { count: 0, schema: { id: f.uuid() } }, // Empty table
      posts: { 
        count: 5, 
        schema: { authorId: f.relation('users', 'id') } // Reference to empty table
      }
    });

    expect(() => mocker.generate()).toThrowError(/Table 'users' is empty/);
  });

  it('should throw error if referencing non-existent field', () => {
     const mocker = new RelationalFaker({
      users: { count: 1, schema: { id: f.uuid() } },
      posts: { 
        count: 1, 
        schema: { authorId: f.relation('users', 'nonExistentField') } 
      }
    });

    expect(() => mocker.generate()).toThrowError(/Field 'nonExistentField' does not exist/);
  });
});