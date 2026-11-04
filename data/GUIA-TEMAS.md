# Guía para escribir temas

Audiencia: alumnos de México en regularización. Español de México, trato de "tú".

## Tarea

1. Lee `data/tandas/tNNN.json`: lista de nodos oficiales.
2. Escribe un tema por nodo en `data/temas/tNNN.json`, como un arreglo JSON.
3. Ejecuta `npm run -s verificar` y corrige solo los errores de tu archivo. No edites otros archivos.

## Forma de cada tema

```json
{"nodo_id":"id exacto del nodo","titulo":"Título breve y claro","slug":"solo-minusculas-y-guiones","palabras":["sinónimos","para","buscar"],"contenido":{
"idea":"Analogía cotidiana que entendería un niño de 7 años",
"pizarron":"Explicación formal paso a paso, al nivel real del tema",
"truco":"Regla mnemotécnica breve",
"practica":{"ejercicio":"...","respuesta":"..."},
"analogias":[{"titulo":"...","texto":"Analogía distinta"},{"titulo":"...","texto":"Otra distinta"}],
"ejercicios":[{"ejercicio":"...","respuesta":"..."},{"ejercicio":"...","respuesta":"..."},{"ejercicio":"...","respuesta":"..."}]}}
```

Exactamente 2 analogías y 3 ejercicios. Mínimos: `idea` y `pizarron` 40 caracteres, `truco` 15, cada analogía 40.

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
