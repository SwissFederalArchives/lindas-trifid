import { resolve, isAbsolute } from 'node:path'
import { pathToFileURL } from 'node:url'
import cloneDeep from 'lodash/cloneDeep.js'

const resolvePath = (modulePath) => {
  // Check for relative paths (starting with . or /) or absolute paths (Windows: C:\, Unix: /)
  if (['.', '/'].includes(modulePath.slice(0, 1)) || isAbsolute(modulePath)) {
    // Convert to file:// URL for cross-platform ESM compatibility
    return pathToFileURL(resolve(modulePath)).href
  } else {
    return modulePath
  }
}

export const loader = async (modulePath) => {
  const plugin = await import(resolvePath(modulePath))
  return plugin.default
}

const load = async (config) => {
  let plugins = {}
  if (config.plugins && typeof config.plugins === 'object') {
    plugins = cloneDeep(config.plugins)
  }

  await Promise.all(
    Object.keys(plugins).map(async (m) => {
      if (plugins[m] === null) {
        delete plugins[m]
        return
      }

      if (!plugins[m].module) {
        throw new Error(`plugin '${m}' has no module configured`)
      }

      plugins[m].module = await loader(plugins[m].module)
    }),
  )

  return plugins
}

export default load
