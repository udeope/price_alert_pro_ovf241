# Reglas de Uso de Hooks en React

## Reglas Fundamentales de los Hooks

- **Llamar Hooks solo en el nivel superior:** Nunca llamar Hooks dentro de bucles, condiciones o funciones anidadas. Esto asegura que los Hooks se llamen en el mismo orden en cada renderizado.
- **Llamar Hooks solo desde funciones de React:** Solo llamar Hooks desde componentes de función de React o desde otros Hooks personalizados.

## Hooks Personalizados

- **Nomenclatura:** Los Hooks personalizados DEBEN empezar con el prefijo `use` (ej: `useOnlineStatus`). Esto es crucial para que el linter de React pueda aplicar las reglas de los Hooks de forma estática.
- **Propósito:** Crear Hooks personalizados para encapsular y reutilizar lógica con estado entre componentes. Un Hook personalizado comparte lógica, no el estado en sí.
- **Claridad:** Nombrar los Hooks personalizados según su propósito (ej: `useFormInput`, `useFetchData`) para que el código del componente sea más declarativo.