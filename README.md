# QueryWalker

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

QueryWalker is a JavaScript library for efficiently traversing DOM elements. It provides two traversal methods: horizontal (parallel) and vertical (sequential), allowing you to process DOM elements based on selectors.

## Features

- **Horizontal Traversal (walkHorizontally)**: Process multiple selectors in parallel
- **Vertical Traversal (walkVertically)**: Process selectors sequentially
- **Async Processing**: Promise-based asynchronous processing support
- **Error Handling**: Customizable exception handling with resolve/reject control
- **Scope Specification**: Traverse within specific DOM elements

## Installation

```bash
npm install querywalker
```

## Usage

### Basic Import

```javascript
import { QueryWalker } from "querywalker";

const { walkHorizontally, walkVertically } = QueryWalker;
```

### Horizontal Traversal (walkHorizontally)

Process multiple selectors in parallel:

```javascript
await walkHorizontally({
  _scope_: document,
  ".button": async ({ element, selector, self }, resolve, reject) => {
    console.log("Button found:", element);
    element.addEventListener("click", () => {
      console.log("Button clicked");
    });
    resolve(); // Explicitly resolve when done
  },
  ".input": async ({ element, selector, self }, resolve, reject) => {
    console.log("Input field found:", element);
    element.addEventListener("input", (e) => {
      console.log("Input value:", e.target.value);
    });
    resolve(); // Explicitly resolve when done
  },
  __exeptionHandler__: async (error, data, resolve, reject) => {
    console.error("Error occurred:", error, data);
    resolve(data.selector); // Resolve with selector name
  },
});
```

### Vertical Traversal (walkVertically)

Process selectors sequentially:

```javascript
await walkVertically({
  _scope_: document.body,
  ".item": async ({ element, selector, self }) => {
    console.log("Processing item:", element);
    // Process each element sequentially
  },
  ".link": async ({ element, selector, self }) => {
    console.log("Processing link:", element);
    // Process link elements
  },
  __exeptionHandler__: async (error, data) => {
    console.error("Error occurred:", error, data);
  },
});
```

## API Reference

### walkHorizontally(options)

Process DOM elements horizontally in parallel.

**Parameters:**

- `options` (Object): Configuration object
  - `_scope_` (Element, default: document): Scope for traversal
  - `__exeptionHandler__` (Function): Exception handler function with resolve/reject parameters
  - `[selector]` (Function): Processing function with selector name as key

**Returns:**

- `Promise<Object>`: Configuration object

### walkVertically(options)

Process DOM elements vertically in sequence.

**Parameters:**

- `options` (Object): Configuration object
  - `_scope_` (Element, default: null): Scope for traversal
  - `__exeptionHandler__` (Function): Exception handler function
  - `[selector]` (Function): Processing function with selector name as key

**Returns:**

- `Promise<Object>`: Configuration object

### Processing Function Parameters

Each selector's processing function receives the following parameters:

- `element` (Element): Target DOM element for processing
- `selector` (String): Selector name (String object)
- `self` (Object): Reference to the configuration object
- `resolve` (Function, walkHorizontally only): Promise resolve function
- `reject` (Function, walkHorizontally only): Promise reject function

### Exception Handler Parameters

The exception handler function receives:

- `error` (Error): The caught exception
- `data` (Object): Object containing element, selector, and self reference
- `resolve` (Function, walkHorizontally only): Promise resolve function
- `reject` (Function, walkHorizontally only): Promise reject function

## Development

### Install Dependencies

```bash
npm install
```

### Build

```bash
npm run build
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Project Structure

```
QueryWalker/
├── src/
│   ├── querywalker.js          # Main export
│   └── Walker/
│       ├── WalkHorizontally.js # Horizontal traversal implementation
│       └── WalkVertically.js   # Vertical traversal implementation
├── test/                       # Test files
├── package.json
├── webpack.config.js
└── README.md
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Please report bugs and feature requests on [GitHub Issues](https://github.com/xoFeulB/QueryWalker/issues).

## Author

BlueFoxEnterprise

## Links

- [GitHub Repository](https://github.com/xoFeulB/QueryWalker)
- [Issues](https://github.com/xoFeulB/QueryWalker/issues)
