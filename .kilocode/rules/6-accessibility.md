# Reglas de Accesibilidad (a11y) en React

## HTML Semántico
- Utilizar siempre elementos HTML semánticos (`<main>`, `<article>`, `<nav>`, etc.) para dar estructura y significado al contenido.

## Atributos ARIA
- Utilizar atributos `aria-*` para proporcionar información adicional sobre el comportamiento y el estado de los componentes a las tecnologías de asistencia.

## Asociación de Etiquetas y Controles
- Siempre asociar las etiquetas (`<label>`) con sus controles de formulario (`<input>`, `<textarea>`).
- **`useId`:** Utilizar el hook `useId` para generar identificadores únicos y estables que puedan ser usados para conectar elementos con `htmlFor` y `id` o `aria-describedby`.

## Gestión del Foco
- Utilizar `useRef` para gestionar el foco de forma programática cuando sea necesario para mejorar la experiencia del usuario (ej: al abrir un modal).