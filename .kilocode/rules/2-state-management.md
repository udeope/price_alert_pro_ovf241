# Reglas de Gestión del Estado en React

## `useState`
- Utilizar para estados simples (primitivos o arrays/objetos pequeños) que son locales a un componente. Es la opción preferida para la mayoría de los casos de estado local.

## `useReducer`
- Utilizar cuando la lógica de estado es compleja o cuando el próximo estado depende del estado anterior.
- Ideal para gestionar estados con múltiples sub-valores o cuando las transiciones de estado son predecibles y complejas, para centralizar la lógica de actualización.

## Context API
- Utilizar para compartir estado que puede ser considerado "global" para un árbol de componentes (ej: tema de la UI, usuario autenticado).
- **NO USAR** para estados que cambian con mucha frecuencia, ya que puede provocar re-renderizados innecesarios en los componentes consumidores.
- Combinar `useReducer` y `Context` para gestionar el estado global de forma escalable. El `dispatch` se pasa a través de un Contexto y el estado a través de otro para optimizar los re-renderizados.