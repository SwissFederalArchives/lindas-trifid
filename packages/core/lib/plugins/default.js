import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { resolve } from 'import-meta-resolve'

import healthPlugin from '../../plugins/health.js'
import staticPlugin from '../../plugins/static.js'
import localsPlugin from '../../plugins/locals.js'

const currentDir = dirname(fileURLToPath(import.meta.url))

const health = {
  module: healthPlugin,
}

const templateStaticFiles = {
  module: staticPlugin,
  paths: '/static/core',
  config: {
    directory: `${currentDir}/../../static`,
  },
}

const robotoPath = fileURLToPath(resolve('@fontsource/roboto', import.meta.url))
const robotoFont = {
  module: staticPlugin,
  paths: '/static/core-fonts/roboto',
  config: {
    directory: dirname(robotoPath),
  },
}

const playfairDisplayPath = fileURLToPath(resolve('@fontsource/playfair-display', import.meta.url))
const playfairDisplayFont = {
  module: staticPlugin,
  paths: '/static/core-fonts/playfair-display',
  config: {
    directory: dirname(playfairDisplayPath),
  },
}

const locals = {
  module: localsPlugin,
  order: 11,
}

export default {
  health,
  templateStaticFiles,
  robotoFont,
  playfairDisplayFont,
  locals,
}
