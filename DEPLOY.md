# Despliegue en Vercel (con el humanizador con IA)

El modo «IA» del humanizador envía el texto a `POST /api/humanize`, una función del
servidor (`api/humanize.ts`) que llama a la **Agent API de Perplexity**. La clave vive
solo en el servidor; el navegador nunca la ve.

En el plan gratuito de Vercel (Hobby) cada función puede durar hasta **300 s**, así
que la IA no se corta aunque tarde (en Netlify gratis el límite es de 10 s).

## 1. Consigue la clave de Perplexity

1. Entra en <https://console.perplexity.ai>.
2. Agrega un método de pago: la API se cobra por uso y es aparte de la suscripción Pro.
3. Crea una **API key** (empieza por `pplx-`). No la pegues en el código.

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
| `PERPLEXITY_API_KEY` | tu clave `pplx-…` |
| `PERPLEXITY_MODEL` | *(opcional)* p. ej. `google/gemini-3.8-flash,openai/gpt-6-luna,perplexity/sonar` |

5. **Deploy**. Cada `git push` a la rama principal vuelve a publicar solo.

Si agregas o cambias la variable después, ve a **Deployments → ⋯ → Redeploy**.

## 4. Prueba

Abre el Detector, pega un párrafo y usa «Humanizar con IA». Si algo falla, la app
muestra el motivo: clave inválida (401/403), sin saldo (402), demasiadas peticiones
(429) o tiempo agotado. Los registros de la función están en Vercel → tu proyecto →
**Logs**.

## En tu computador (desarrollo)

1. Copia `.env.example` como `.env.local` y pon tu clave en `PERPLEXITY_API_KEY`.
2. `npm run dev`. El servidor de Vite atiende `/api/humanize` con la misma lógica.

`.env.local` no se sube a GitHub (está en `.gitignore`).

## Alternativa: Netlify

El proyecto conserva `netlify.toml` y `netlify/functions/humanize.ts`. Allí la función
se corta a los 10 s: publica desde GitHub (no arrastrando `dist`), configura
`PERPLEXITY_API_KEY` y baja el tamaño de los trozos en `src/lib/aiHumanize.ts`
(`CHUNK_TARGET` ≈ 1200 y `CHUNK_MAX` ≈ 1600).
