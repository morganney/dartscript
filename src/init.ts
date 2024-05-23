import { parseArgs, type ParseArgsConfig } from 'node:util'

import { log, logError } from './util.js'

type ParsedArgs = {
  func: string
  in: string
  out: string
  module: 'es' | 'cjs'
  help: boolean
  default: boolean
}

const options = {
  func: {
    type: 'string',
    short: 'f',
    default: '',
  },
  out: {
    type: 'string',
    short: 'o',
    default: 'func.js',
  },
  module: {
    type: 'string',
    short: 'm',
    default: 'es',
  },
  default: {
    type: 'boolean',
    short: 'd',
    default: false,
  },
  help: {
    type: 'boolean',
    short: 'h',
    default: false,
  },
} satisfies ParseArgsConfig['options']

export const init = async (args?: ParseArgsConfig['args']) => {
  let parsedArgs: ParsedArgs | null = null

  try {
    const { values, positionals } = parseArgs({
      args,
      options,
      allowPositionals: true,
    })

    parsedArgs = {
      ...(values as ParsedArgs),
      in: positionals[0],
    }
  } catch (err) {
    if (err instanceof Error) {
      logError(err.message)
    }
  }

  if (parsedArgs?.help) {
    log('Usage: dartscript [options] <path-to-file.dart>\n')
    log('Options:')
    log(
      '--func, -f [string] \t The name of the dart function to extract into a module. Required.',
    )
    log('--out, -o [path] \t Where to save the output file. Defaults to func.js.')
    log('--module, -m \t\t What module system to use. Defaults to es. [es | cjs].')
    log('--default, -d \t\t Whether to use a default export. Defaults to named export.')
    log('--help, -h \t\t Print this message.')

    return null
  }

  if (!parsedArgs?.in) {
    logError('Input dart file required as positional.')

    return null
  }

  if (!parsedArgs?.func) {
    logError('The --func option is required.')

    return null
  }

  return parsedArgs
}
