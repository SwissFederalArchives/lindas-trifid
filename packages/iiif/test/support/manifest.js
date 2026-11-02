import rdf from '@lindas/env'

const rdfType = rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type')
const first = rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#first')
const rest = rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#rest')
const nil = rdf.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#nil')
const items = rdf.namedNode('http://www.w3.org/ns/activitystreams#items')
const integer = rdf.namedNode('http://www.w3.org/2001/XMLSchema#integer')

export const createManifest = () => {
  const dataset = rdf.dataset()
  const node = path => rdf.namedNode(`https://example.test/${path}`)
  const add = (subject, predicate, object) => dataset.add(rdf.quad(subject, predicate, object))
  const type = (subject, uri) => add(subject, rdfType, rdf.namedNode(uri))
  let cellId = 0
  const list = (subject, values) => {
    // The production IIIF API prefixes blank-node values in fixBlankNodes().
    const cells = values.map(() => rdf.blankNode(`_:fixture-list-${++cellId}`))
    add(subject, items, cells[0] || nil)
    values.forEach((value, index) => {
      add(cells[index], first, value)
      add(cells[index], rest, cells[index + 1] || nil)
    })
  }
  const manifest = node('manifest')
  const canvas = node('canvas/1')
  const secondCanvas = node('canvas/2')
  const page = node('annotation-page')
  const annotation = node('annotation')
  const image = node('image.jpg')

  type(manifest, 'http://iiif.io/api/presentation/3#Manifest')
  add(manifest, rdf.namedNode('http://www.w3.org/2000/01/rdf-schema#label'), rdf.literal('Grüezi', 'de'))
  add(manifest, rdf.namedNode('http://www.w3.org/2000/01/rdf-schema#label'), rdf.literal('Hello', 'en'))
  list(manifest, [canvas, secondCanvas])
  type(canvas, 'http://iiif.io/api/presentation/3#Canvas')
  type(secondCanvas, 'http://iiif.io/api/presentation/3#Canvas')
  add(canvas, rdf.namedNode('http://www.w3.org/2003/12/exif/ns#height'), rdf.literal('100', integer))
  add(canvas, rdf.namedNode('http://www.w3.org/2003/12/exif/ns#width'), rdf.literal('200', integer))
  list(canvas, [page])
  type(page, 'http://www.w3.org/ns/activitystreams#OrderedCollectionPage')
  list(page, [annotation])
  type(annotation, 'http://www.w3.org/ns/oa#Annotation')
  add(annotation, rdf.namedNode('http://www.w3.org/ns/oa#hasBody'), image)
  add(annotation, rdf.namedNode('http://www.w3.org/ns/oa#hasTarget'), canvas)
  add(annotation, rdf.namedNode('http://www.w3.org/ns/oa#motivatedBy'), rdf.namedNode('http://www.w3.org/ns/oa#painting'))
  type(image, 'http://purl.org/dc/dcmitype/StillImage')
  add(image, rdf.namedNode('http://purl.org/dc/elements/1.1/format'), rdf.literal('image/jpeg'))
  return dataset
}
