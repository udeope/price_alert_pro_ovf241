# Guía de Desarrollo para Proyectos React

Este documento establece las directrices y mejores prácticas para el desarrollo de aplicaciones con React, basadas exclusivamente en la documentación oficial. El objetivo es asegurar la consistencia, mantenibilidad y rendimiento del código.

## 1. Estructura de Directorios y Convenciones de Nomenclatura

La documentación oficial de React no impone una estructura de directorios estricta, pero sí establece convenciones claras para la organización y nomenclatura de los componentes.

### Reglas:

-   **Nomenclatura de Componentes:** Los nombres de los archivos de componentes y las funciones/clases de los componentes deben usar `PascalCase`.
    -   **Hacer:** `MyComponent.js`, `function MyComponent() {}`
    -   **No Hacer:** `myComponent.js`, `function myComponent() {}`

-   **Nomenclatura de Archivos:** Utilizar `PascalCase` para componentes (`MyComponent.js`) y `camelCase` para archivos que no son componentes, como helpers o servicios (`apiClient.js`).

-   **Organización de Componentes:** Agrupar los componentes por funcionalidad o ruta es un enfoque común. Para componentes complejos, se puede crear un directorio propio que contenga el componente, sus estilos y sus tests.
    ```
    /components
    ├── /Button
    │   ├── Button.js
    │   ├── Button.module.css
    │   └── Button.test.js
    └── /Avatar
        ├── Avatar.js
        └── Avatar.module.css
    ```

-   **Exportaciones e Importaciones:**
    -   Utilizar `export default` para el componente principal de un archivo.
    -   Utilizar `export` (nombrado) para componentes auxiliares o funciones dentro del mismo archivo.
    -   Las importaciones deben coincidir con la exportación.

    ```jsx
    // Gallery.js
    export function Profile() {
      // ...
    }

    export default function Gallery() {
      // ...
    }

    // App.js
    import Gallery, { Profile } from './Gallery.js';
    ```

## 2. Gestión del Estado

La elección de la herramienta de gestión de estado adecuada es crucial para la escalabilidad de la aplicación.

### Reglas:

-   **`useState`:** Utilizar para estados simples (primitivos o arrays/objetos pequeños) que son locales a un componente. Es la opción preferida para la mayoría de los casos.

    ```jsx
    // Hacer: Para estado simple y local.
    function Counter() {
      const [count, setCount] = useState(0);
      // ...
    }
    ```

-   **`useReducer`:** Utilizar cuando la lógica de estado es compleja o cuando el próximo estado depende del anterior. Es ideal para gestionar estados con múltiples sub-valores o cuando las transiciones de estado son predecibles y complejas.

    ```jsx
    // Hacer: Para lógica de estado compleja.
    function tasksReducer(tasks, action) {
      switch (action.type) {
        case 'added': { /* ... */ }
        case 'changed': { /* ... */ }
        default: { throw Error('Unknown action: ' + action.type); }
      }
    }

    function TaskApp() {
      const [tasks, dispatch] = useReducer(tasksReducer, initialTasks);
      // ...
    }
    ```

-   **Context API:** Utilizar para compartir estado que puede ser considerado "global" para un árbol de componentes, como el tema de la UI, el usuario autenticado o las preferencias de idioma.
    -   **No Hacer:** Usar Context para todo. Evitarlo para estados que cambian con mucha frecuencia, ya que puede provocar re-renderizados innecesarios en los componentes consumidores.
    -   **Hacer:** Combinar `useReducer` y `Context` para gestionar el estado global de forma escalable. El `dispatch` se pasa a través de un Contexto y el estado a través de otro.

    ```jsx
    // TasksContext.js
    export const TasksContext = createContext(null);
    export const TasksDispatchContext = createContext(null);

    // TaskApp.js
    export default function TaskApp() {
      const [tasks, dispatch] = useReducer(tasksReducer, initialTasks);

      return (
        <TasksContext.Provider value={tasks}>
          <TasksDispatchContext.Provider value={dispatch}>
            {/* ... */}
          </TasksDispatchContext.Provider>
        </TasksContext.Provider>
      );
    }
    ```

## 3. Uso Correcto de Hooks

Los Hooks deben seguir reglas estrictas para funcionar correctamente.

### Reglas:

-   **Reglas de los Hooks:**
    1.  **Llamar Hooks solo en el nivel superior:** No llamar Hooks dentro de bucles, condiciones o funciones anidadas.
    2.  **Llamar Hooks solo desde funciones de React:** Llamarlos desde componentes de función o desde Hooks personalizados.

    ```jsx
    // No Hacer: Llamar un Hook dentro de una condición.
    if (cond) {
      const theme = useContext(ThemeContext); // 🔴 Mal
    }
    ```

-   **Hooks Personalizados:**
    -   **Nomenclatura:** Deben empezar siempre con el prefijo `use` (ej: `useFormInput`). Esto permite al linter de React verificar las Reglas de los Hooks.
    -   **Propósito:** Extraer lógica con estado de los componentes para que pueda ser reutilizada. Un Hook personalizado comparte lógica, no estado. Cada llamada a un Hook personalizado obtiene un estado independiente.
    -   **Hacer:** Crear Hooks con un propósito claro y específico, nombrados por lo que hacen (ej: `useOnlineStatus`, `useFetchData`).

    ```jsx
    // Hacer: Un Hook personalizado que reutiliza lógica con estado.
    export function useFormInput(initialValue) {
      const [value, setValue] = useState(initialValue);

      function handleChange(e) {
        setValue(e.target.value);
      }

      return {
        value,
        onChange: handleChange
      };
    }
    ```

## 4. Estrategias de Estilización

React no prescribe una única forma de estilizar, pero la documentación oficial muestra varios enfoques comunes.

### Reglas:

-   **`className` con CSS:** Es el método más tradicional y recomendado para la mayoría de los estilos estáticos. Los estilos se definen en archivos `.css` y se aplican a los elementos mediante el atributo `className`.

    ```jsx
    // En tu JS:
    <img className="avatar" />

    // En tu CSS:
    .avatar {
      border-radius: 50%;
    }
    ```

-   **Estilos en Línea (`style`):** Utilizar principalmente para estilos dinámicos que dependen del estado o las props del componente.
    -   El atributo `style` acepta un objeto JavaScript con propiedades en `camelCase`.
    -   **No Hacer:** Usar estilos en línea para todo, ya que puede afectar el rendimiento y la mantenibilidad.

    ```jsx
    // Hacer: Para estilos que dependen de props o estado.
    <img
      className="avatar"
      style={{
        width: user.imageSize,
        height: user.imageSize
      }}
    />
    ```

-   **CSS Modules o CSS-in-JS:** Para proyectos grandes, considerar soluciones que eviten colisiones de nombres de clases, como CSS Modules o librerías de CSS-in-JS. La documentación no se decanta por una, pero reconoce su utilidad.

## 5. Optimización del Rendimiento

Evitar re-renderizados y cálculos innecesarios es clave para una aplicación fluida.

### Reglas:

-   **`memo`:** Envolver componentes con `memo` para evitar que se vuelvan a renderizar si sus props no han cambiado. Es útil para componentes funcionalmente puros que son costosos de renderizar.

    ```jsx
    // Hacer: Memoizar un componente costoso.
    const MyComponent = memo(function MyComponent(props) {
      /* Lógica de renderizado */
    });
    ```

-   **`useCallback`:** Utilizar para memoizar funciones, especialmente las que se pasan como props a componentes hijos envueltos en `memo`. Esto evita que el componente hijo se vuelva a renderizar solo porque la función prop es una nueva instancia en cada renderizado del padre.

    ```jsx
    // Hacer: Para pasar callbacks estables a componentes memoizados.
    const handleSubmit = useCallback((details) => {
      // ...
    }, [productId, referrer]);

    return <ShippingForm onSubmit={handleSubmit} />;
    ```

-   **`useMemo`:** Utilizar para memoizar el resultado de un cálculo costoso. La función solo se volverá a ejecutar si una de sus dependencias ha cambiado.

    ```jsx
    // Hacer: Para evitar cálculos costosos en cada renderizado.
    const visibleTodos = useMemo(
      () => filterTodos(todos, tab),
      [todos, tab]
    );
    ```

-   **Code-Splitting con `lazy` y `Suspense`:** Utilizar para dividir el código de la aplicación en fragmentos más pequeños que se cargan bajo demanda.
    -   Envolver el componente cargado con `lazy` en un componente `Suspense` para mostrar una UI de carga mientras se espera.

    ```jsx
    import { lazy, Suspense } from 'react';

    const MarkdownPreview = lazy(() => import('./MarkdownPreview.js'));

    function App() {
      return (
        <Suspense fallback={<p>Loading...</p>}>
          <MarkdownPreview />
        </Suspense>
      );
    }
    ```

## 6. Accesibilidad (a11y)

Crear aplicaciones accesibles es una responsabilidad fundamental.

### Reglas:

-   **HTML Semántico:** Utilizar siempre elementos HTML semánticos (`<main>`, `<article>`, `<nav>`, etc.) para dar estructura y significado al contenido.

-   **Atributos ARIA:** Utilizar atributos `aria-*` para proporcionar información adicional sobre el comportamiento y el estado de los componentes a las tecnologías de asistencia.

-   **Asociar Etiquetas y Controles:** Siempre asociar las etiquetas (`<label>`) con sus controles de formulario (`<input>`, `<textarea>`).
    -   **`useId`:** Utilizar el hook `useId` para generar identificadores únicos y estables que puedan ser usados para conectar elementos con `htmlFor` y `id` o `aria-describedby`. Esto evita colisiones de ID cuando los componentes se reutilizan.

    ```jsx
    // Hacer: Usar useId para generar IDs únicos para accesibilidad.
    import { useId } from 'react';

    function Form() {
      const passwordHintId = useId();
      return (
        <>
          <input type="password" aria-describedby={passwordHintId} />
          <p id={passwordHintId}>
            La contraseña debe tener al menos 18 caracteres.
          </p>
        </>
      );
    }
    ```

-   **Gestión del Foco:** Utilizar `useRef` para gestionar el foco de forma programática cuando sea necesario para mejorar la experiencia del usuario, por ejemplo, al abrir un modal o después de una acción del usuario.

    ```jsx
    // Hacer: Gestionar el foco con refs cuando sea necesario.
    function Form() {
      const inputRef = useRef(null);

      function handleClick() {
        inputRef.current.focus();
      }

      return (
        <>
          <input ref={inputRef} />
          <button onClick={handleClick}>Focus the input</button>
        </>
      );
    }