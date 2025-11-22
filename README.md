# RelationalFaker

**Deterministic, topologically sorted relational mock data generator for
TypeScript.**

[![npm
version](https://img.shields.io/npm/v/relational-faker?style=flat-square&color=blue)]()
[![downloads](https://img.shields.io/npm/dm/relational-faker?style=flat-square)]()
[![license](https://img.shields.io/npm/l/relational-faker?style=flat-square)]()
[![bundle
size](https://img.shields.io/bundlephobia/minzip/relational-faker?style=flat-square&color=green)]()

------------------------------------------------------------------------

## Why RelationalFaker?

Standard mocking libraries (like `faker.js`) are excellent for
generating scalar values but struggle with **relational integrity**.

-   ❌ **The Problem:** If you need to generate `Users`, `Posts`, and
    `Comments`, you must manually manage relational ordering.
-   ✅ **The Solution:** **RelationalFaker** analyzes your schema,
    builds a **Dependency Graph**, and uses **Topological Sort** to
    automatically determine the correct generation order.

## Features

-   **🧠 Auto-Dependency Resolution**
-   **🛡️ TypeScript First**
-   **⚛️ Deterministic Seeding**
-   **🧩 Zero Config**
-   **📦 Lightweight**

------------------------------------------------------------------------

## Installation

``` bash
npm install relational-faker @faker-js/faker
# or
yarn add relational-faker @faker-js/faker
# or
pnpm add relational-faker @faker-js/faker
```

------------------------------------------------------------------------

## Quick Start

``` ts
import { RelationalFaker, f } from 'relational-faker';

const db = new RelationalFaker({
  posts: {
    count: 5,
    schema: {
      id: f.uuid(),
      title: f.custom(() => "My Awesome Post"),
      authorId: f.relation('users', 'id'),
    }
  },

  users: {
    count: 2,
    schema: {
      id: f.uuid(),
      name: f.fullName(),
      email: f.email(),
    }
  }
});

const data = db.generate();

console.log(data.users);
console.log(data.posts);
```

------------------------------------------------------------------------

## API Reference

### `f.relation(tableName, fieldName)`

Creates a foreign key reference to another table.

### Scalar Generators

`f.uuid()`, `f.fullName()`, `f.email()`, etc.

### Custom Generator

``` ts
createdAt: f.custom(() => new Date().toISOString())
```

------------------------------------------------------------------------

## Testing with Seeds

``` ts
const mocker = new RelationalFaker(config);
mocker.seed(12345);
const result1 = mocker.generate();
```

------------------------------------------------------------------------

## Known Limitations

-   Circular dependencies are not yet supported.
-   Optimized for datasets up to \~10k records.

------------------------------------------------------------------------

## Contributing

1.  Fork the project\
2.  Create your feature branch\
3.  Commit your changes\
4.  Push to your branch\
5.  Open a Pull Request

------------------------------------------------------------------------

## License

MIT License.
