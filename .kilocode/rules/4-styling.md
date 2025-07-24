# Reglas de Estilización en React

## `className` con CSS
- Es el método preferido para la mayoría de los estilos estáticos.
- Los estilos se definen en archivos `.css` (o `.module.css` para estilos con ámbito local) y se aplican a los elementos mediante el atributo `className`.

## Estilos en Línea (`style`)
- Utilizar **únicamente** para estilos dinámicos que dependen del estado o las props del componente (ej: `width`, `height`, `color` calculados en tiempo de ejecución).
- El atributo `style` acepta un objeto JavaScript con propiedades en `camelCase`.
- **NO USAR** para estilos estáticos, ya que puede impactar negativamente el rendimiento y la mantenibilidad.

## CSS Modules o CSS-in-JS
- Para proyectos a gran escala, se recomienda el uso de CSS Modules o librerías de CSS-in-JS para evitar colisiones de nombres de clases y mejorar la modularidad de los estilos.