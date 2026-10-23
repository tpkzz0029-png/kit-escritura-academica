# Despliegue

## Por qué el humanizador de IA da 404 en un hosting estático

El modo «IA» del humanizador envía el texto a `POST /api/humanize`, un pequeño
servicio del lado del servidor (la clave del modelo vive ahí, nunca en el
navegador). Un hosting que solo sirve archivos estáticos (carpeta `dist/`)
no ejecuta ese servicio → error 404.

En ese caso la app **no se rompe**: detecta el 404 y aplica automáticamente
el parafraseo local (traducción de ida y vuelta + reglas de humanización),
que funciona 100 % en el navegador. Pero para la reescritura completa con IA
hay que desplegar en un servidor que ejecute funciones.

## Opción recomendada: Vercel (gratis, incluye la función /api/humanize)

El proyecto ya está preparado: `api/humanize.ts` se despliega como función
serverless automáticamente y `vercel.json` resuelve las rutas de la app.

1. Sube la carpeta `app/` a un repositorio de GitHub.
2. En [vercel.com](https://vercel.com) → **Add New Project** → importa el repo.
3. Vercel detecta Vite automáticamente (build: `npm run build`, salida: `dist`).
4. (Opcional) **Settings → Environment Variables**: añade `KIMI_AGENT_GW_KEY`
   con tu clave del gateway Kimi para tener límites propios. Sin ella, la app
   usa la clave integrada de respaldo.
5. **Deploy**. Listo: el humanizador con IA funciona en la URL pública.

## Opción alternativa: Netlify (gratis, con la función incluida)

El proyecto también trae todo lo necesario para Netlify:

- `netlify/functions/humanize.ts` → función serverless con el mismo motor.
- `netlify.toml` → build (`npm run build` → `dist`), reenvío de
  `/api/humanize` a la función y fallback de la SPA.

**Importante:** en Netlify **no** sirve arrastrar la carpeta `dist/` con
«Drop» (eso solo sirve archivos estáticos, sin funciones → volverías al mismo
404). Tienes dos formas válidas:

**A) Conectar el repositorio (recomendado):**
1. Sube la carpeta `app/` a GitHub (o actualiza el repo si ya existe).
2. En [app.netlify.com](https://app.netlify.com) → **Add new site → Import an
   existing project** → elige el repo.
3. En **Base directory** escribe `app` (si el repo tiene `app/` en la raíz);
   Netlify leerá el `netlify.toml` de esa carpeta (build `npm run build`,
   publish `dist`).
4. (Opcional) **Site settings → Environment variables**: añade
   `KIMI_AGENT_GW_KEY`. Sin ella se usa la clave de respaldo integrada.
5. **Deploy**. Cada `git push` a la rama principal redepliega solo.

**B) Netlify CLI:**
```bash
cd app
npm i -g netlify-cli
netlify deploy --build --prod
```
(usa tu cuenta y detecta el `netlify.toml`).

Después de cualquiera de las dos, el humanizador con IA funcionará en la URL
pública de Netlify sin el aviso de «servidor no disponible».

## Si prefieres tu host actual (estático)

La app funciona completa excepto la reescritura con IA del humanizador, que
usará el parafraseo local como respaldo (avisando en pantalla). Ninguna otra
herramienta depende del servidor: conversor, detector, plagio, corrector y
geología corren íntegramente en el navegador.
