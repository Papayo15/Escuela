# Escuela de regularización

Biblioteca de explicaciones basada en el temario oficial de la SEP, con Maestro en vivo opcional.

## Funciona sin claves

Sin configuración, la app muestra toda la biblioteca, sin chat y sin código de acceso:

```bash
npm install
npm run dev
```

## Planes de acceso

- Con `ACCESS_CODE` y `COOKIE_SECRET`, la biblioteca pide código.
- `ACCESS_CODE` abre la biblioteca. `PREMIUM_CODE` abre además el Maestro en vivo y las fotos de tareas.
- Cambia los códigos cada mes: la cookie incluye el código, así que los accesos anteriores expiran.

El cobro es manual. Un código compartido se puede pasar a otras personas.

## Activar el Maestro en vivo

Crea `.env.local` a partir de `.env.example`. El chat aparece cuando además existen `OPENROUTER_API_KEY` y `PREMIUM_CODE`.

1. Crea la clave en OpenRouter, carga saldo, fija un límite y activa la recarga automática.
2. Para que los temas nuevos se guarden, crea una base en Neon, ejecuta `npm run cargar` con `DATABASE_URL` en `.env.local`, y solo después agrégala en Vercel. Una base vacía deja el sitio sin temas.

Los modelos están en `src/lib/openrouter.ts`. Son alias de OpenRouter, que pasan solos a la versión vigente de cada familia, y llevan un tope de 3 / 15 dólares por millón de tokens. Si un alias desaparece, responde el siguiente; para cambiarlos sin tocar el código, usa `OPENROUTER_MODELS`. Los respaldos cubren fallas y límites de tasa, pero no la falta de saldo: sin saldo fallan todos, y la biblioteca sigue funcionando.

Las fotos se reducen en el navegador, no se guardan y se envían solo a proveedores sin retención de datos.

Sin `DATABASE_URL`, la biblioteca vive en memoria: los temas creados en el chat se pierden al reiniciar.

## Publicar en Vercel

Una escuela necesita el plan Pro porque el plan Hobby es solo para uso personal no comercial. Agrega las variables en el proyecto y despliega con `vercel`.

## Biblioteca

- `data/temario/`: temas oficiales con documento y página.
- `data/temas/`: 566 explicaciones, una por tema oficial.
- `data/avance.json`: avance por nivel y materia.

`npm run verificar` comprueba que cada tema exista literalmente en su PDF, que cada explicación apunte a un tema real y que las fórmulas se dibujen bien.

## Actualizaciones de la SEP

`.github/workflows/vigilar-fuentes.yml` corre el día 1 de cada mes. Revisa los portales oficiales con `npm run vigilar` y abre un issue en GitHub si un documento cambió. GitHub avisa por correo. Solo reporta: nunca cambia la biblioteca.

Para activarlo, sube el proyecto a un repositorio de GitHub.

## Comandos

| Comando | Uso |
|---|---|
| `npm run dev` | Servidor local |
| `npm test` | Pruebas |
| `npm run verificar` | Revisión de la biblioteca |
| `npm run cargar` | Carga la biblioteca en Neon |
| `npm run vigilar` | Busca cambios en documentos oficiales |
