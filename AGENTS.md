# Thinker-FTS - Agent Guide

## Project Overview

Thinker-FTS is a fast, extendable, and standalone pure JavaScript full-text search engine that works across Node.js, Deno, and browsers.

## Project Structure

```
thinker-fts/
├── src/                  # Source code
│   ├── Thinker.js       # Main entry point
│   ├── Thinker.single.js # Single export wrapper
│   ├── index.js         # Index backend
│   ├── processors.js    # Word/field processors (stemmers, soundex, etc.)
│   ├── rankers.js       # Result ranking algorithms
│   └── utils.js         # Helper utilities
├── test/                # Test files
│   ├── test.js          # Main test entry (ESM)
│   ├── test.cjs         # CommonJS test entry
│   └── suites/          # Test suites
│       └── default.cjs  # Main test suite
├── dist/                # Built distribution files
│   ├── thinker.cjs      # UMD module
│   ├── thinker.mjs      # ES module
│   └── thinker.min.*    # Minified versions
└── rollup.config.js     # Build configuration
```

## Development Environment

The project uses **Node.js** as the primary development runtime with ES modules.

### Setup
```bash
npm ci
```

## Contribution Guidelines

### Pre-commit Checks

Before committing changes, always run:
```bash
npm run test
```

This executes:
- **Linting**: `eslint ./**/*.js` - checks for code quality issues
- **Testing**: `mocha` - runs the test suite

### Testing

Run tests during development:
```bash
npm run test
```

Run tests with coverage:
```bash
npm run test:coverage
```

### Full Build

Before submitting a PR, run the full build to ensure all checks pass:
```bash
npm run build:ci
```

This runs linting, builds distribution files, and runs tests with coverage.

### Key Points

- Base work on the `master` branch
- Add test cases for all changes
- The project has few external dependencies - avoid adding new runtime dependencies
- Follow existing code style (tabs, double quotes, semicolons)
- Update documentation if changing public APIs
- The `dist/` files are committed to the repository

## Features

- In-memory full-text search
- Natural language search with modifiers (+, -, "exact")
- Partial matching with wildcards
- Weighted ranker with configurable field weights
- Word processors: stemmers (English, Swedish), soundex, stopwords
- Field processors: HTML stripper
- Result filtering and reduction
- Metadata collection
