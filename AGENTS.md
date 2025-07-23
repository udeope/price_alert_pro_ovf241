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

## Calidad y Mejores Prácticas
- **Código Limpio:**
  - Utiliza nombres descriptivos y claros para variables, funciones y clases.
  - Crea funciones pequeñas que sigan el principio de responsabilidad única (SRP).
  - Evita la duplicación de código aplicando el principio DRY (Don't Repeat Yourself).
  - Añade comentarios solo para explicar lógica compleja (el "porqué", no el "qué").
- **Pruebas:**
  - Escribe pruebas unitarias para toda la lógica de negocio crítica.
  - Asegúrate de que las pruebas cubran los casos de éxito y los casos límite.
  - Las pruebas deben ser rápidas, fiables y fáciles de ejecutar.
- **Seguridad:**
  - Valida y sanea todas las entradas de datos del usuario para prevenir ataques (XSS, inyección de SQL, etc.).
  - Nunca expongas información sensible como claves de API o contraseñas en el código fuente. Usa variables de entorno.
  - Gestiona los errores de forma segura, sin filtrar detalles internos de la aplicación al usuario.
- **Rendimiento:**
  - Optimiza las consultas a la base de datos, usando índices y seleccionando solo los datos necesarios.
  - En el frontend, utiliza técnicas como la memoización (`React.memo`), el lazy loading para componentes e imágenes.
  - Monitoriza y reduce el tamaño de los bundles de JavaScript para acelerar los tiempos de carga.

