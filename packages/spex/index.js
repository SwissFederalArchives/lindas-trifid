import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { resolve } from 'import-meta-resolve'
import fastifyStatic from '@fastify/static'

const __dirname = dirname(fileURLToPath(import.meta.url))

const defaults = {
  template: join(__dirname, 'views/index.hbs'),
}

const defaultOptions = {
  url: '/query',
  user: null,
  password: null,
  graph: null,
  prefixes: [],
  forceIntrospection: false,
}

/**
 * Create Plugin.
 *
 * @param {import('fastify').FastifyInstance} server
 * @param {*} config
 * @param {*} render
 * @returns
 */
const createPlugin = async (server, config, render) => {
  const options = { ...defaultOptions, ...(config || {}) }
  options.url ||= defaultOptions.url
  const spexOptions = {
    sparqlEndpoint: options.url,
    username: options.user,
    password: options.password,
    forceIntrospection: options.forceIntrospection,
    namedGraph: options.graph,
    prefixes: options.prefixes,
  }
  config = { ...defaults, ...config, spexOptions }

  // Serve static files from SPEX dist folder
  const distPath = fileURLToPath(resolve('@lindas/spex', import.meta.url))
  server.register(async (assets) => {
    await assets.register(fastifyStatic, {
      root: dirname(distPath),
      prefix: '/spex/static/',
    })
    // SPEX's .cjs bundle is a browser script, not an application/node resource.
    assets.get('/spex/static/spex.umd.cjs', (request, reply) => {
      return reply.type('text/javascript').sendFile('spex.umd.cjs', { contentType: false })
    })
  })

  /**
   * Route handler.
   * @param {import('fastify').FastifyRequest & { session: Map<string, any> }} request Request.
   * @param {import('fastify').FastifyReply} reply Reply.
   */
  const handler = async (request, reply) => {
    const pathname = request.url.split('?')[0]

    // Enforce trailing slash
    if (pathname.slice(-1) !== '/') {
      reply.redirect(`${pathname}/`)
      return reply
    }

    const content = await render(
      request,
      config.template,
      {
        // Embed JSON as an object literal; escape '<' to prevent </script> breakout.
        options: JSON.stringify(spexOptions).replace(/</g, '\\u003c'),
      },
      { title: 'SPEX' },
    )

    reply.type('text/html').send(content)
    return reply
  }
  return handler
}

/** @type {import('../core/types/index.js').TrifidPlugin} */
const trifidFactory = async (trifid) => {
  const { server, config, render } = trifid

  return {
    defaultConfiguration: async () => {
      return {
        methods: ['GET'],
        paths: [
          '/spex',
          '/spex/',
        ],
      }
    },
    routeHandler: async () => createPlugin(server, config, render),
  }
}

export default trifidFactory
export { createPlugin }
