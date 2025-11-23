import { RelationalFaker, f, Exporters } from '../src/index';

// 1. Define the schema configuration
const db = new RelationalFaker({
  // Note: 'posts' is defined BEFORE 'users' deliberately.
  // The topological sort engine will automatically correct the execution order.
  posts: {
    count: 5,
    schema: {
      id: f.uuid(),
      
      // v1.1 Feature: Context Awareness in Custom Generators
      // We can access 'ctx.store' to get the current count of generated items for sequential numbering.
      title: f.custom((ctx) => `Blog Post #${ctx.store.length + 1}`),
      
      authorId: f.relation('users', 'id'), // Depends on 'users' table
      isActive: f.boolean(),

      // v1.1 Feature: Smart Constraints
      // 'updatedAt' is guaranteed to be after 'createdAt'
      createdAt: f.date.past(),
      updatedAt: f.date.soon(10, 'createdAt'), 
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
      
      // Accessing the current row being generated
      text: f.custom(() => "Awesome article!") 
    }
  }
});

// 2. Set Seed (Ensures deterministic output for reproducible tests)
db.seed(123);

// 3. Generate Data
try {
  console.log("🚀 Generating relational mock data...");
  const data = db.generate();
  
  console.log("✅ Data Generated Successfully!");
  
  // Pretty print specific fields to demonstrate features
  console.log("\n--- Users ---");
  console.table(data.users);

  console.log("\n--- Posts (Notice: Sequential Titles & Valid Dates) ---");
  console.table(data.posts.map(p => ({
    id: p.id.split('-')[0] + '...', // Truncate UUID for display
    title: p.title,
    author: p.authorId.split('-')[0] + '...',
    dates: `${p.createdAt.toISOString().split('T')[0]} -> ${p.updatedAt.toISOString().split('T')[0]}`
  })));

  console.log("\n--- Comments ---");
  console.table(data.comments.map(c => ({
    id: c.id.split('-')[0] + '...',
    postId: c.postId.split('-')[0] + '...',
    userId: c.userId.split('-')[0] + '...',
    text: c.text
  })));

  // ==========================================
  // v1.2.0 Feature Showcase: EXPORTERS
  // ==========================================

  console.log("\n\n📦 [v1.2.0] EXPORT FEATURES DEMO");
  console.log("==================================");

  // A) SQL Export
  // Generates valid INSERT statements for PostgreSQL (default), MySQL, etc.
  console.log("\n--- 💾 SQL Export (Postgres Dialect) ---");
  const sqlOutput = Exporters.toSQL(data, { dialect: 'postgres' });
  console.log(sqlOutput); 
  // You could write this to a file: fs.writeFileSync('seed.sql', sqlOutput);

  // B) CSV Export
  // Generates a dictionary of CSV strings: { users: "...", posts: "..." }
  console.log("\n--- 📊 CSV Export (Users Table) ---");
  const csvOutput = Exporters.toCSV(data);
  console.log(csvOutput.users);
  // You could write this to a file: fs.writeFileSync('users.csv', csvOutput.users);

} catch (error) {
  console.error("❌ Generation Failed:", error);
}