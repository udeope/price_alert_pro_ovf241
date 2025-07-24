# Reglas de Estructura y Nomenclatura de React

## Nomenclatura de Componentes y Archivos

- Los nombres de los archivos de componentes React y sus funciones o clases correspondientes DEBEN usar `PascalCase`.
  - **Ejemplo Correcto:** `UserProfile.js`, `function UserProfile() {}`
  - **Ejemplo Incorrecto:** `userProfile.js`, `function userProfile() {}`

- Los archivos que no exportan componentes React (por ejemplo, helpers, servicios, utilidades) DEBEN usar `camelCase`.
  - **Ejemplo Correcto:** `apiClient.js`, `stringUtils.ts`

## Organización y Exportaciones

- El componente principal dentro de un archivo DEBE ser exportado usando `export default`.
- Cualquier componente auxiliar o función exportada desde el mismo archivo DEBE usar una exportación nombrada (`export`).
- Al importar, la sintaxis debe coincidir con la exportación (`import Componente from './Componente'` para default, `import { Helper } from './utils'` para nombradas).