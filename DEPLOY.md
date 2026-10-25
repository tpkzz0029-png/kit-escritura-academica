# Despliegue en Vercel (con el humanizador con IA)

El modo «IA» del humanizador envía el texto a `POST /api/humanize`, una función del
servidor (`api/humanize.ts`) que llama a **Google Gemini** (o, si lo prefieres, a
Perplexity). La clave vive solo en el servidor; el navegador nunca la ve.

En el plan gratuito de Vercel (Hobby) cada función puede durar hasta **300 s**, así
que la IA no se corta aunque tarde (en Netlify gratis el límite es de 10 s).

## 1. Consigue la clave de Gemini (gratis)

1. Entra en <https://aistudio.google.com/apikey> con tu cuenta de Google.
2. **Create API key** (si te pide un proyecto, crea uno nuevo). La clave empieza por `AIza`.
3. No la pegues en el código. La suscripción Gemini Plus/Advanced no es necesaria:
   la API tiene su propio plan gratuito con límites diarios para los modelos Flash.

> Alternativa de pago: Perplexity (<https://console.perplexity.ai>, requiere créditos).
> Usa `PERPLEXITY_API_KEY` y, si tienes ambas claves, `AI_PROVIDER=perplexity`.

## 2. Sube el proyecto a GitHub

Antes de subir, comprueba en tu computador que compila: `npm run build`.
Si hay errores, Vercel también fallará al publicar.

## 3. Crea el proyecto en Vercel

1. Entra en <https://vercel.com> con tu cuenta de GitHub.
2. **Add New → Project** → importa el repositorio.
3. Vercel detecta Vite y lee `vercel.json` (build `npm run build`, salida `dist`,
   función `api/humanize.ts` con 300 s y redirección de las rutas a la app).
   Si el proyecto está en una subcarpeta del repositorio (por ejemplo `app/`), elígela
   en **Root Directory**.
4. Antes de pulsar Deploy, abre **Environment Variables** y agrega:

| Variable | Valor |
| --- | --- |
| `GEMINI_API_KEY` | tu clave `AIza…` |
| `GEMINI_MODEL` | *(opcional)* p. ej. `gemini-3.8-flash,gemini-3.6-flash,gemini-3.5-flash-lite` |

5. **Deploy**. Cada `git push` a la rama principal vuelve a publicar solo.

Si agregas o cambias la variable después, ve a **Deployments → ⋯ → Redeploy**.

## 4. Prueba

Abre el Detector, pega un párrafo y usa «Humanizar con IA». Si algo falla, la app
muestra el motivo: clave inválida, límite del plan gratuito alcanzado (429) o tiempo
agotado. Los registros de la función están en Vercel → tu proyecto →
**Logs**.

## En tu computador (desarrollo)

1. Copia `.env.example` como `.env.local` y pon tu clave en `GEMINI_API_KEY`.
2. `npm run dev`. El servidor de Vite atiende `/api/humanize` con la misma lógica.

`.env.local` no se sube a GitHub (está en `.gitignore`).

## Alternativa: Netlify

El proyecto conserva `netlify.toml` y `netlify/functions/humanize.ts`. Allí la función
se corta a los 10 s: publica desde GitHub (no arrastrando `dist`), configura
`GEMINI_API_KEY` y baja el tamaño de los trozos en `src/lib/aiHumanize.ts`
(`CHUNK_TARGET` ≈ 1200 y `CHUNK_MAX` ≈ 1600).
