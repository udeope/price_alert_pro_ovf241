# Reglas de Optimización del Rendimiento en React

## `memo`
- Envolver componentes con `memo` para evitar re-renderizados si sus props no han cambiado.
- Ideal para componentes puros que son costosos de renderizar.

## `useCallback`
- Utilizar para memoizar funciones, especialmente callbacks pasados a componentes hijos memoizados, para evitar re-renderizados innecesarios.

## `useMemo`
- Utilizar para memoizar el resultado de cálculos costosos. La función solo se re-ejecutará si sus dependencias cambian.

## Code-Splitting (`lazy` y `Suspense`)
- Utilizar `React.lazy` para componentes que no son necesarios en la carga inicial.
- Envolver los componentes `lazy` en un componente `Suspense` para mostrar una UI de carga.