const path = process.argv[2]
const mod = await import('file:///' + path.replace(/\\/g, '/'))
const r1 = await mod.handler({ httpMethod: 'GET' })
console.log('GET:', r1.statusCode, r1.body)
const r2 = await mod.handler({ httpMethod: 'POST', body: JSON.stringify({ text: '' }) })
console.log('POST vacío:', r2.statusCode, r2.body)
const r3 = await mod.handler({ httpMethod: 'POST', body: 'no-json' })
console.log('POST malformado:', r3.statusCode, r3.body.slice(0, 60))
