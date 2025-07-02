# OpenCode

This file provides guidelines for working on this codebase.

## Commands

- `npm run dev`: Starts the development server (frontend and backend).
- `npm run lint`: Lints the code using TypeScript and ESLint.
- `npm run dev:frontend`: Runs the frontend Vite dev server.
- `npm run dev:backend`: Runs the Convex dev server.

There are no specific test commands in `package.json`.

## Code Style

- **Formatting**: This project uses Prettier for code formatting.
- **Linting**: ESLint is used for linting. See `eslint.config.js` for rules.
  - Unused variables prefixed with `_` are ignored.
  - Usage of `any` is allowed but should be minimized.
- **Types**: This is a TypeScript project. Please use types wherever possible.
- **Imports**: Organize imports at the top of the file.

## Convex

This is a Convex project. Please follow these guidelines:

- Define the database schema in `convex/schema.ts`.
- Place queries, mutations, and actions in `convex/`.
- Use `internal` functions for code not meant to be called from the client.
- Always validate arguments and return values in Convex functions.
- For more detailed guidelines, refer to the official Convex documentation.

## Convex Best Practices

This project uses Convex and follows the guidelines in `.cursor/rules/convex_rules.mdc`. Here are some highlights:

- **Function Syntax**: Always use the new function syntax for queries, mutations, and actions.
- **Validators**: Use validators for all arguments and return values. Use `v.null()` for functions with no return value.
- **Schema**: Define your data model in `convex/schema.ts`. Name indexes clearly (e.g., `by_field1_and_field2`).
- **TypeScript**: Use `Id<'tableName'>` for document IDs to ensure type safety.
- **Queries**: Prefer `withIndex` over `filter` for performance.
- **Internal Functions**: Use `internalQuery`, `internalMutation`, and `internalAction` for functions not exposed to the client.

