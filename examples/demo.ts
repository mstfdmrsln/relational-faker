import { RelationalFaker, f, Exporters, crossJoin } from '../src/index';

// ==========================================
// v1.3 Feature Prep: Many-to-Many
// ==========================================
// Initialize the cross-join generator to ensure unique student-course pairs.
const enrollmentsJoin = crossJoin('students', 'courses');

// 1. Define the schema configuration
const db = new RelationalFaker({
  
  // --- Standard Relations (One-to-Many) ---

  users: {
    count: 2,
    schema: {
      id: f.uuid(),
      name: f.fullName(),
      email: f.email()
    }
  },

  posts: {
    count: 5,
    schema: {
      id: f.uuid(),
      
      // v1.1 Feature: Context Awareness
      // Access 'ctx.store' to get the current count for sequential titles.
      title: f.custom((ctx) => `Blog Post #${ctx.store.length + 1}`),
      
      authorId: f.relation('users', 'id'), // Auto-resolved dependency
      isActive: f.boolean(),

      // v1.1 Feature: Smart Constraints
      // Guarantees 'updatedAt' is chronologically after 'createdAt'.
      createdAt: f.date.past(),
      updatedAt: f.date.soon(10, 'createdAt'), 
    }
  },

  comments: {
    count: 10,
    schema: {
      id: f.uuid(),
      postId: f.relation('posts', 'id'), 
      userId: f.relation('users', 'id'),
      text: f.custom(() => "Awesome article!") 
    }
  },

  // --- v1.3 Feature: Many-to-Many Relations ---

  students: {
    count: 3,
    schema: { id: f.uuid(), name: f.fullName() }
  },
  
  courses: {
    count: 3,
    schema: { id: f.uuid(), title: f.custom((ctx) => `Course ${100 + ctx.store.length}`) }
  },

  enrollments: {
    count: 5, // Requesting 5 unique pairs out of 9 possible combinations (3x3).
    schema: {
      id: f.uuid(),
      // Using synchronized generators for unique pairings
      studentId: enrollmentsJoin.left,
      courseId: enrollmentsJoin.right,
      enrolledAt: f.date.past()
    }
  }
});

// 2. Set Seed (Ensures deterministic output)
db.seed(123);

// 3. Generate Data
try {
  console.log("🚀 Generating relational mock data...");
  const data = db.generate();
  
  console.log("✅ Data Generated Successfully!");
  
  // Display One-to-Many Data
  console.log("\n--- Posts (Sequential Titles & Smart Dates) ---");
  console.table(data.posts.map(p => ({
    id: p.id.substring(0, 8) + '...',
    title: p.title,
    author: p.authorId.substring(0, 8) + '...',
    dates: `${p.createdAt.toISOString().split('T')[0]} -> ${p.updatedAt.toISOString().split('T')[0]}`
  })));

  // Display Many-to-Many Data
  console.log("\n--- Enrollments (Unique Many-to-Many Pairs) ---");
  console.table(data.enrollments.map(e => ({
    id: e.id.substring(0, 8) + '...',
    studentId: e.studentId.substring(0, 8) + '...',
    courseId: e.courseId.substring(0, 8) + '...',
    enrolledAt: e.enrolledAt.toISOString().split('T')[0]
  })));

  // ==========================================
  // v1.2 Feature Showcase: Exporters
  // ==========================================

  console.log("\n📦 [v1.2] EXPORT DEMO");
  console.log("=====================");

  console.log("\n--- 💾 SQL Export (Postgres) ---");
  // Export only the enrollments table for demonstration
  const sqlOutput = Exporters.toSQL({ enrollments: data.enrollments }, { dialect: 'postgres' });
  console.log(sqlOutput); 

  console.log("\n--- 📊 CSV Export (Users) ---");
  const csvOutput = Exporters.toCSV(data);
  console.log(csvOutput.users);

} catch (error) {
  console.error("❌ Generation Failed:", error);
}