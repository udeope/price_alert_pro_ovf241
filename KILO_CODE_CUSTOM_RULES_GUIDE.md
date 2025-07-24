# Guía para Crear y Gestionar Reglas Personalizadas en Kilo Code

Esta guía proporciona un recorrido completo sobre cómo agregar y gestionar reglas personalizadas en Kilo Code, basándose exclusivamente en la documentación oficial.

## 1. Conceptos Fundamentales

Las reglas personalizadas son un mecanismo poderoso para definir comportamientos y restricciones específicas del proyecto para el agente de IA de Kilo Code. Permiten asegurar un formato consistente, restringir el acceso a archivos sensibles y, en general, personalizar el comportamiento de la IA para las necesidades de tu proyecto.

### El Archivo `kilocode.json` y la Sección `rules`

La configuración de las reglas personalizadas se gestiona principalmente a través de un archivo `kilocode.json` en la raíz de tu proyecto. Dentro de este archivo, la sección `rules` es donde se definen las reglas.

La estructura básica es un array de objetos, donde cada objeto representa una regla.

```json
{
  "rules": [
    {
      "name": "NombreDeLaRegla",
      "match": "patron-a-buscar",
      "message": "Mensaje de error o advertencia.",
      "fix": "Instrucción para la IA sobre cómo arreglar el problema."
    }
  ]
}
```

## 2. Guía de Implementación Paso a Paso

### Configuración Inicial

Para empezar a definir reglas, crea un archivo `.kilocode/rules.json` en el directorio raíz de tu proyecto. Dentro de este archivo, define un objeto con una propiedad `rules` que contenga un array de tus reglas personalizadas.

### Creación de una Regla Básica

A continuación se muestra un ejemplo práctico de una regla simple que prohíbe el uso de `console.log`.

```json
{
  "rules": [
    {
      "name": "No-Console-Log",
      "match": "console\\.log",
      "message": "El uso de 'console.log' no está permitido en el código de producción. Por favor, elimínalo o reemplázalo con un logger apropiado.",
      "fix": "Elimina la declaración 'console.log' o reemplázala con una llamada a un servicio de logging aprobado."
    }
  ]
}
```

**Explicación de las Propiedades:**

-   **`name`**: Un identificador único y descriptivo para la regla.
-   **`match`**: El patrón que Kilo Code buscará en el código. Puede ser una cadena de texto simple o una expresión regular. En el ejemplo, `console\\.log` es una expresión regular que busca la cadena "console.log".
-   **`message`**: El mensaje que se mostrará al desarrollador cuando se detecte una violación de la regla. Debe ser claro y explicar por qué la regla es importante.
-   **`fix`**: Una instrucción directa para el agente de IA sobre cómo solucionar el problema. Esta es una guía para la corrección automática.

### Uso de Patrones Avanzados

La propiedad `match` es muy flexible y soporta expresiones regulares para definir patrones complejos.

**Ejemplo: Forzar el uso de `const` sobre `let` cuando sea posible.**

```json
{
  "rules": [
    {
      "name": "Prefer-Const",
      "match": "let\\s+([a-zA-Z_][a-zA-Z0-9_]*)\\s*=",
      "message": "Se prefiere 'const' sobre 'let' para variables que no se reasignan. Considera usar 'const' para mejorar la inmutabilidad.",
      "fix": "Si la variable no se reasigna, cambia 'let' por 'const'."
    }
  ]
}
```

En este caso, la expresión regular `let\\s+([a-zA-Z_][a-zA-Z0-9_]*)\\s*=` busca declaraciones de variables con `let` para sugerir el cambio a `const`.

## 3. Mejores Prácticas y Estrategias

### Organización de Múltiples Reglas

Para proyectos grandes, se recomienda organizar las reglas en archivos separados dentro de un directorio `.kilocode/rules/`. Kilo Code cargará automáticamente todas las reglas de este directorio.

```
.kilocode/
└── rules/
    ├── formatting.md
    ├── restricted_files.md
    └── naming_conventions.md
```

Esta estructura mejora la mantenibilidad y permite agrupar las reglas por categoría.

### Mensajes de Error Claros

Un buen mensaje de error debe:
1.  **Identificar el problema:** ¿Qué está mal?
2.  **Explicar por qué es un problema:** ¿Cuál es el impacto?
3.  **Sugerir una solución:** ¿Cómo se puede arreglar?

**Ejemplo:**

-   **Pobre:** "No uses `var`."
-   **Mejor:** "El uso de `var` está desaconsejado. Utiliza `let` para variables que se reasignan y `const` para variables que no, para evitar problemas de hoisting y mejorar la legibilidad del código."

### Diseño de Soluciones (`fix`) Seguras

La propiedad `fix` debe ser una instrucción clara y precisa para la IA.
-   **Ser específico:** En lugar de "arregla el código", di "reemplaza `var` con `let`".
-   **Considerar efectos secundarios:** Advierte sobre posibles impactos. Por ejemplo, si una regla sugiere cambiar el nombre de una función, el `fix` podría incluir "actualiza todas las referencias a esta función en el proyecto".
-   **Proporcionar alternativas:** Si hay varias formas de solucionar un problema, puedes indicarlas.

Siguiendo estas directrices, podrás crear un conjunto de reglas personalizadas robusto y eficaz que mejore la calidad y consistencia de tu código con la ayuda de Kilo Code.