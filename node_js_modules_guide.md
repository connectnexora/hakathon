# Node.js Modules and Require Function

> **Source:** Master Node.js Series by Piyush Garg  
> **Topic:** Modules, Code Modularization, `require()`, `module.exports`, and Exports Pattern in Node.js

---

## 1. What is a Module?

In Node.js, a **Module** is a reusable block of code whose signatures and functions exist in a separate file. Rather than writing all application logic inside a single file (like `index.js` or `app.js`), modular programming allows you to break your codebase into smaller, manageable, and isolated components.

### Benefits of Modularization:
* **Maintainability:** Easier to locate, fix, and update specific functionality.
* **Reusability:** Functions and logic can be reused across different parts of the application.
* **Clean Code Structure:** Keeps the entry file concise and focused on initialization/orchestration.

---

## 2. CommonJS Module System

Node.js traditionally uses the **CommonJS** module system by default. In CommonJS:
* You load modules using the **`require()`** function.
* You export variables, functions, or objects using **`module.exports`** or **`exports`**.

---

## 3. Practical Example: Custom Math Module

### Step 1: Creating a Custom Module (`math.js`)

Suppose we want to separate mathematical operations into a dedicated file named `math.js`.

```javascript
// math.js

function add(a, b) {
    return a + b;
}

function sub(a, b) {
    return a - b;
}

// Single Export (Overrides module.exports with a single item/function)
// module.exports = add;

// Multiple Exports using an Object
module.exports = {
    addFn: add,
    subFn: sub,
};
```

---

### Step 2: Importing and Using the Module (`hello.js` / `index.js`)

To use functions defined in `math.js`, use the `require()` function with the relative path (`./`).

```javascript
// index.js

// Importing custom modules requires a relative path (e.g., './math')
const math = require('./math');

console.log('Math Result (Add):', math.addFn(2, 5)); // Output: 7
console.log('Math Result (Sub):', math.subFn(10, 4)); // Output: 6
```

---

## 4. Alternative Export Syntax (`exports.<key>`)

In Node.js, `exports` is an alias/shortcut pointing to `module.exports`. You can attach functions or properties directly to `exports`:

```javascript
// math.js using direct exports

exports.add = (a, b) => a + b;
exports.sub = (a, b) => a - b;
```

> **Note / Best Practice:** Avoid reassigning `exports = ...` directly (e.g., `exports = add`), because it breaks the reference to `module.exports`. Always use `module.exports = ...` when exporting a single function or object, or attach properties via `exports.propertyName`.

---

## 5. Built-in (Core) Modules vs Custom Modules vs Third-Party Modules

| Module Type | Description | Require Syntax Example |
| :--- | :--- | :--- |
| **Custom Modules** | Developer-created files in the local repository. Requires relative path. | `const math = require('./math');` |
| **Built-in Modules** | Pre-packaged modules provided directly by Node.js runtime (e.g., `fs`, `path`, `http`, `os`). | `const fs = require('fs');` |
| **Third-Party Modules** | Packages installed via NPM into `node_modules` (e.g., `express`, `mongoose`). | `const express = require('express');` |

---

## 6. Key Takeaways

1. Every file in Node.js is treated as an isolated module by default (variables declared in one file do not pollute the global scope of another).
2. Use `./` or `../` inside `require()` for custom files to tell Node.js to look in local directories rather than `node_modules` or built-in modules.
3. `module.exports` is the primary object returned when another file calls `require()`.
