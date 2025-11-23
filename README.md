Tabii, işte **v1.1.0** özelliklerini içeren, kopyalayıp direkt `README.md` dosyana yapıştırabileceğin ham (raw) metin:

````markdown
# RelationalFaker

<div align="center">

  <h3>🔗 RelationalFaker</h3>
  
  <p>
    <strong>Deterministic, topologically sorted relational mock data generator for TypeScript.</strong>
  </p>

  <p>
    <a href="https://www.npmjs.com/package/relational-faker">
      <img src="https://img.shields.io/npm/v/relational-faker?style=flat-square&color=blue" alt="npm version" />
    </a>
    <a href="https://www.npmjs.com/package/relational-faker">
      <img src="https://img.shields.io/npm/dm/relational-faker?style=flat-square" alt="downloads" />
    </a>
    <a href="https://github.com/mstfdmrsln/relational-faker/blob/main/LICENSE">
      <img src="https://img.shields.io/npm/l/relational-faker?style=flat-square" alt="license" />
    </a>
    <a href="https://bundlephobia.com/result?p=relational-faker">
      <img src="https://img.shields.io/bundlephobia/minzip/relational-faker?style=flat-square&color=green" alt="bundle size" />
    </a>
  </p>

</div>

---

## 💡 Why RelationalFaker?

Standard mocking libraries (like `faker.js`) are excellent for generating scalar values but struggle with **relational integrity**.

- ❌ **The Problem:** If you need to generate `Users`, `Posts`, and `Comments`, you have to manually manage the order. You can't generate a Comment before its Post.
- ✅ **The Solution:** **RelationalFaker** analyzes your schema, builds a **Dependency Graph**, and uses **Topological Sort** to automatically determine the correct generation order.

## ✨ Features

- **🧠 Auto-Dependency Resolution:** Just define relations; the engine figures out the execution order.
- **🔄 Recursive / Self-Referencing Relations:** Support for trees, nested comments, or organizational hierarchies (v1.1).
- **🎯 Smart Constraints:** Define rules like "End Date must be after Start Date" (v1.1).
- **🛡️ TypeScript First:** Fully typed definitions.
- **⚛️ Deterministic Seeding:** Reproducible test runs.

---

## 📦 Installation

```bash
npm install relational-faker @faker-js/faker
# or
yarn add relational-faker @faker-js/faker
````

-----

## 🚀 Quick Start

```typescript
import { RelationalFaker, f } from 'relational-faker';

const db = new RelationalFaker({
  users: {
    count: 5,
    schema: {
      id: f.uuid(),
      name: f.fullName(),
    }
  },

  tasks: {
    count: 20,
    schema: {
      id: f.uuid(),
      // Context-aware generation: Access the store to get current count
      title: f.custom((ctx) => `Task #${ctx.store.length + 1}`), 
      assigneeId: f.relation('users', 'id'),
      
      // ✨ Smart Constraint: Due date is always AFTER created date
      createdAt: f.date.past(),
      dueAt: f.date.soon(10, 'createdAt'), 
    }
  },
  
  categories: {
    count: 10,
    schema: {
      id: f.uuid(),
      name: f.custom(() => "Category"),
      // 🔄 Self-Reference: Categories can have parent categories
      parentId: f.relation('categories', 'id'), 
    }
  }
});

const data = db.generate();

console.log(data.users);
console.log(data.tasks); // Dates are logically consistent
```

-----

## 📚 API Reference

### `f.relation(tableName, fieldName)`

Creates a foreign key reference. Supports self-referencing (recursive) tables automatically. The engine guarantees that the referenced record exists.

### `f.date.soon(days, refField?)`

Generates a date in the future relative to `refField`.

  - `days`: Range of days to generate within.
  - `refField`: Name of another field in the same row (e.g., `'createdAt'`).

### `f.custom((context) => T)`

Provides access to the generation context for complex logic.

  - `context.row`: The current row being generated.
  - `context.store`: The array of rows generated so far for the current table.
  - `context.db`: The complete database of previously generated tables.

<!-- end list -->

```typescript
// Example: Calculate tax based on another field in the same row
total: f.custom(({ row }) => row.price * 1.18)
```

-----

## 🧪 Testing with Seeds

For unit tests, consistency is key. Use `.seed()` to ensure the same data is generated every time.

```typescript
const mocker = new RelationalFaker(config);
mocker.seed(12345); 
const result = mocker.generate();
```

-----

## ⚠️ Known Limitations

  - **Cross-Table Circular Dependencies:** While self-references (A -\> A) are supported, direct circular loops between two tables (A -\> B -\> A) are currently detected and blocked to prevent infinite loops.
  - **Large Datasets:** Performance is optimized for typical testing scenarios (up to \~10k records).

-----

## 🤝 Contributing

Contributions are welcome\!

1.  Fork the project
2.  Create your feature branch
3.  Commit your changes
4.  Push to the branch
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License.

```
```