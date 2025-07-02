## Commands
- **Dev:** `npm run dev` (runs frontend and backend)
- **Lint:** `npm run lint` (runs tsc, convex dev, and vite build)
- **Test:** No dedicated test command found.

## Code Style
- **Frameworks:** React (Vite), Convex.
- **Language:** TypeScript.
- **Formatting:** Use Prettier for code formatting.
- **Imports:** Use path alias `@/*` for `src/*`.
- **Types:** Use `v` from `convex/values` for runtime validation. Explicit `any` is allowed but should be used sparingly.
- **Convex:**
  - Use the new function syntax for queries, mutations, and actions.
  - Always include validators for arguments and return values.
  - Use `internalQuery`, `internalMutation`, and `internalAction` for private functions.
  - Define database schema in `convex/schema.ts`.
  - Use `withIndex` for queries instead of `filter`.
- **Error Handling:** Throw errors in Convex functions for invalid states.
