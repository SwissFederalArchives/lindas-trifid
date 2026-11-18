// @ts-check

import { deepStrictEqual, rejects, strictEqual } from 'node:assert'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { before, describe, it, mock } from 'node:test'

import jsonld from 'jsonld'
import { createManifest } from './support/manifest.js'

let frame
const contextLoads = new Map()

before(async () => {
  const contexts = JSON.parse(await readFile(new URL('./support/iiif-contexts.json', import.meta.url), 'utf8'))
  // The production frame captures its loader at import time. Stub only that
  // construction so framing uses a frozen official context without internet.
  const loaderMock = mock.method(jsonld.documentLoaders, 'node', () => async (url) => {
    const key = url.replace(/^http:/, 'https:')
    strictEqual(Object.hasOwn(contexts, key), true, `unexpected external context: ${url}`)
    contextLoads.set(url, (contextLoads.get(url) || 0) + 1)
    return { contextUrl: null, documentUrl: url, document: structuredClone(contexts[key]) }
  })
  try {
    frame = (await import('../src/frame.js')).default
  } finally {
    loaderMock.mock.restore()
  }
})

describe('IIIF JSON-LD compatibility', () => {
  it('converts an RDF/JS dataset into ordered IIIF canvases and annotations', async () => {
    const doc = await jsonld.fromRDF(createManifest(), {})
    const result = await frame(doc)
    strictEqual(result['@context'], 'http://iiif.io/api/presentation/3/context.json')
    strictEqual(result.id, 'https://example.test/manifest')
    strictEqual(result.type, 'Manifest')
    deepStrictEqual(result.label, { de: ['Grüezi'], en: ['Hello'] })
    deepStrictEqual(result.items.map(canvas => canvas.id), [
      'https://example.test/canvas/1', 'https://example.test/canvas/2',
    ])
    const canvas = result.items[0]
    strictEqual(canvas.type, 'Canvas')
    strictEqual(canvas.height, '100')
    strictEqual(canvas.width, '200')
    const annotation = canvas.items[0].items[0]
    strictEqual(annotation.type, 'Annotation')
    strictEqual(annotation.target, canvas.id)
    strictEqual(annotation.motivation, 'oa:painting')
    strictEqual(annotation.body.id, 'https://example.test/image.jpg')
    strictEqual(annotation.body.type, 'Image')
    strictEqual(annotation.body.format, 'image/jpeg')
  })

  it('reuses the production IIIF context cache across framing calls', async () => {
    const doc = await jsonld.fromRDF(createManifest(), {})
    deepStrictEqual(await frame(doc), await frame(doc))
    strictEqual(contextLoads.size > 0, true)
    for (const loads of contextLoads.values()) strictEqual(loads, 1)
  })
})

const serve = async (t, handler) => {
  const server = createServer(handler)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())))
  const address = server.address()
  return `http://127.0.0.1:${address.port}`
}

describe('JSON-LD remote context compatibility', () => {
  it('loads redirected contexts and resolves nested relative context URLs', async (t) => {
    const paths = []
    const origin = await serve(t, (request, response) => {
      paths.push(request.url)
      if (request.url === '/start') {
        response.writeHead(302, { location: '/contexts/main.jsonld' }).end()
      } else if (request.url === '/contexts/main.jsonld') {
        response.writeHead(200, { 'content-type': 'application/ld+json' })
          .end(JSON.stringify({ '@context': ['nested.jsonld', { id: '@id' }] }))
      } else if (request.url === '/contexts/nested.jsonld') {
        response.writeHead(200, { 'content-type': 'application/ld+json' })
          .end(JSON.stringify({ '@context': { name: 'https://schema.org/name' } }))
      } else {
        response.writeHead(404).end()
      }
    })
    const output = await jsonld.expand({
      '@context': `${origin}/start`, id: 'https://example.test/item', name: 'Grüezi',
    }, { documentLoader: jsonld.documentLoaders.node() })
    deepStrictEqual(output, [{
      '@id': 'https://example.test/item', 'https://schema.org/name': [{ '@value': 'Grüezi' }],
    }])
    deepStrictEqual(paths, ['/start', '/contexts/main.jsonld', '/contexts/nested.jsonld'])
  })

  it('rejects unavailable remote contexts instead of returning incomplete data', async (t) => {
    const origin = await serve(t, (_request, response) => response.writeHead(503).end())
    await rejects(jsonld.expand({ '@context': `${origin}/unavailable`, name: 'Grüezi' }, {
      documentLoader: jsonld.documentLoaders.node(),
    }), error => error.details?.code === 'loading remote context failed')
  })
})
