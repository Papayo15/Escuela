# Escuela de regularización

Biblioteca de explicaciones basada en el temario oficial de la SEP, con chat opcional de Claude.

## Funciona sin claves

Sin configuración, la app muestra toda la biblioteca, sin chat y sin código de acceso:

```bash
npm install
npm run dev
```

## Activar el chat

Crea `.env.local` a partir de `.env.example`. El chat aparece cuando existen `ANTHROPIC_API_KEY`, `ACCESS_CODE` y `COOKIE_SECRET`. Desde ese momento, la app pide el código.

1. Crea la clave en la Claude Console, carga saldo y fija un tope mensual.
2. Para que los temas nuevos se guarden, crea una base en Neon, define `DATABASE_URL` y ejecuta `npm run cargar`.

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
