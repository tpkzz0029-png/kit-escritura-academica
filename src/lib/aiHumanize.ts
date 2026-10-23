// Humanización automática vía el proxy interno de la app (/api/humanize).
// El cliente NO lleva clave ni configuración: envía el texto al mismo
// origen y el servidor (middleware de Vite en local, función serverless al
// desplegar) se encarga de la clave y del prompt maestro.

export interface HumanizeResult {
  text: string
  changes: string
  truncated: boolean
}

export async function humanizeWithAI(
  text: string,
  onProgress?: (msg: string) => void
): Promise<HumanizeResult> {
  onProgress?.('Enviando el texto a la IA para humanizarlo…')
  // relativo a la URL actual: funciona en local y en el despliegue
  const url = new URL('api/humanize', window.location.href).toString()

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
  } catch {
    throw new Error('No se pudo contactar con el servidor de humanización. Reintenta.')
  }

  let data: { text?: string; changes?: string; truncated?: boolean; error?: string } = {}
  try {
    data = await res.json()
  } catch {
    // cuerpo no JSON
  }

  if (!res.ok || data.error) {
    if (res.status === 404) {
      throw new Error(
        'El servidor de IA no está disponible en este alojamiento (falta la función /api/humanize). ' +
          'Se aplicará el parafraseo local como alternativa, o despliega la app en Vercel para tener la IA completa.'
      )
    }
    throw new Error(data.error || `El servidor respondió con error ${res.status}.`)
  }
  if (!data.text || !data.text.trim()) {
    throw new Error('La IA respondió sin contenido. Reintenta.')
  }
  onProgress?.('Texto humanizado recibido.')
  return {
    text: data.text.trim(),
    changes: (data.changes ?? '').trim(),
    truncated: data.truncated === true,
  }
}
