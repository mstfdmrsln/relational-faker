import { RelationalFaker, f } from '../src/index';

// 1. Define the schema configuration
const db = new RelationalFaker({
  // Note: 'posts' is defined BEFORE 'users' deliberately.
  // The topological sort engine will automatically correct the execution order.
  posts: {
    count: 5,
    schema: {
      id: f.uuid(),
      title: f.custom(() => "Blog Post " + Math.floor(Math.random() * 100)),
      authorId: f.relation('users', 'id'), // Depends on 'users' table
      isActive: f.boolean()
    }
  },
  
  users: {
    count: 2,
    schema: {
      id: f.uuid(),
      name: f.fullName(),
      email: f.email()
    }
  },

  comments: {
    count: 10,
    schema: {
      id: f.uuid(),
      // Depends on both 'posts' and 'users' tables
      postId: f.relation('posts', 'id'), 
      userId: f.relation('users', 'id'),
      text: f.custom(() => "Awesome article!")
    }
  }
});

// 2. Set Seed (Optional - Ensures deterministic output for reproducible tests)
db.seed(123);

// 3. Generate Data
try {
  const data = db.generate();
  console.log("✅ Data Generated Successfully!");
  console.log(JSON.stringify(data, null, 2));
} catch (error) {
  console.error("❌ Generation Failed:", error);
}