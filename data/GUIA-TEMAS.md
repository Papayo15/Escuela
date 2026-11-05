# Guía para escribir temas

Audiencia: alumnos de México en regularización. Español de México, trato de "tú".

## Tarea

1. Lee `data/tandas/tNNN.json`: lista de nodos oficiales.
2. Escribe un tema por nodo en `data/temas/tNNN.json`, como un arreglo JSON.
3. Ejecuta `npm run -s verificar` y corrige solo los errores de tu archivo. No edites otros archivos.

## Forma de cada tema

```json
{"nodo_id":"id exacto del nodo","titulo":"Título breve y claro","slug":"solo-minusculas-y-guiones","palabras":["sinónimos","para","buscar"],"contenido":{
"idea":"Analogía cotidiana que entendería un niño de 5 a 7 años",
"pizarron":"Explicación paso a paso con palabras de niño, sin perder la fórmula o regla del nivel real",
"truco":"Regla mnemotécnica breve",
"practica":{"ejercicio":"...","respuesta":"..."},
"analogias":[{"titulo":"...","texto":"Analogía distinta"},{"titulo":"...","texto":"Otra distinta"}],
"ejercicios":[{"ejercicio":"...","respuesta":"..."},{"ejercicio":"...","respuesta":"..."},{"ejercicio":"...","respuesta":"..."}]}}
```

Exactamente 2 analogías y 3 ejercicios. Mínimos: `idea` y `pizarron` 40 caracteres, `truco` 15, cada analogía 20.

## Reglas

- Extensión: 150 a 250 palabras por tema. Breve y exacto.
- El tema debe enseñar el contenido del nodo, con su nivel (`nivel`, `etapa`). No inventes requisitos oficiales.
- Verifica cada cálculo y cada respuesta. Si un dato es dudoso, no lo incluyas.
- Sé neutral en temas sociales y sexualidad: lenguaje apropiado para la edad, sin datos personales.
- Si un nodo es de habilidades o valores, enseña el concepto con situaciones concretas y un ejercicio de reflexión con criterios de respuesta.
- Markdown permitido. Matemáticas en `$...$` y `$$...$$`; química con `$\ce{H2O}$`.
- En JSON, escribe cada barra invertida doble: `\\frac`, `\\ce`, y saltos de línea como `\n`.
- No uses el signo de pesos para dinero: escribe "pesos".
- Slugs descriptivos y únicos; incluye el nivel si el título es común, por ejemplo `celula-secundaria`.
- Para seno usa `\\sin`; KaTeX no reconoce `\\sen`.

## Inglés

- Explica en español y da los ejemplos en inglés.
- En primaria incluye la pronunciación aproximada entre paréntesis, por ejemplo: *house* (jaus).
- Los programas sintéticos de primaria solo nombran el inglés como lengua extranjera; los subtemas de primaria son propuesta de la escuela.

## Estilo sencillo (obligatorio en todos los niveles)

Lo debe poder seguir un niño de 5 a 7 años, aunque el tema sea de preparatoria. La fórmula o regla real se conserva; lo que cambia es cómo se explica.

- El `pizarron` siempre abre con el enunciado completo y correcto, en negritas: **La ley:**, **La regla:** o **Qué es:**. Es lo que el alumno debe poder decir en un examen.
- Después explica ese enunciado con palabras simples, y hasta entonces pone el ejemplo. El ejemplo nunca sustituye a la ley.
- Oraciones cortas: una idea por oración.
- Palabras de todos los días. Si hace falta una palabra técnica, explícala enseguida con palabras simples.
- Primero un ejemplo con cosas conocidas; después la regla.
- Cada letra de una fórmula se explica con palabras: "F es qué tan fuerte empujas".
- Un solo paso por línea, con las cuentas completas.
- Nada de tablas largas ni listas de datos para memorizar.

Los tres `ejercicios` son la tarea del alumno y se muestran siempre: deben poder resolverse solos con lo explicado.

## Inglés

La materia enseña a usar el idioma: -ing, pasado, perfect, futuro y demás gramática. Se explica en español, con ejemplos en inglés. El vocabulario solo es apoyo.
