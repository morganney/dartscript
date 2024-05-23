#!/usr/bin/env node

import { parseArgs } from 'node:util'
import { readFile, writeFile, rm } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'

import { parse } from 'acorn'
import { simple } from 'acorn-walk'
import MagicString from 'magic-string'

import { compile } from './compile.js'

type ParsedArgs = {
  func: string
  in: string
  out: string
  module: 'es' | 'cjs'
  default: boolean
}
let parsedArgs: ParsedArgs | null = null

try {
  const { values, positionals } = parseArgs({
    options: {
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
        default: false,
      },
    },
    allowPositionals: true,
  })

  if (!positionals.length) {
    throw new Error('Input dart file required as positional.')
  }

  if (!values?.func) {
    throw new Error('The --func option is required.')
  }

  parsedArgs = {
    ...(values as Omit<ParsedArgs, 'identifier'>),
    in: positionals[0],
  }
} catch (err) {
  if (err instanceof Error) {
    console.log(err.message)
  }
}

if (parsedArgs) {
  const hex = randomBytes(4).toString('hex')
  const compileOut = `_${hex}_.js`
  const getFileContents = async () => {
    const buffer = await readFile(compileOut)

    return buffer.toString()
  }
  const writeFileContents = async (contents: string) => {
    const magic = new MagicString(contents)

    if (parsedArgs.module === 'cjs') {
      magic.prepend(
        parsedArgs.default
          ? 'module.exports = function '
          : `exports.${parsedArgs.func} = function `,
      )
    } else {
      magic.prepend(parsedArgs.default ? 'export default function ' : 'export function ')
    }
    await writeFile(parsedArgs.out, magic.toString())
  }
  const convertFunctionToModule = async () => {
    const contents = await getFileContents()
    const magic = new MagicString(contents)
    const ast = parse(contents, { ecmaVersion: 2023 })
    const found: string[] = []

    if (ast) {
      simple(ast, {
        ObjectExpression(node) {
          node.properties.forEach(property => {
            if (property.type === 'Property') {
              if (
                property.key.type === 'Identifier' &&
                property.key.name === parsedArgs.func
              ) {
                found.push(magic.snip(property.start, property.end).toString())
              }
            }
          })
        },
      })
    }

    if (found.length) {
      try {
        await writeFileContents(found[0])
        console.log(`Function written to file ${parsedArgs.out}`)
      } catch (err) {
        if (err instanceof Error) {
          console.log(`Unable to write function to file: ${err.message}`)
        }
      }
    }
  }
  const main = async () => {
    try {
      await compile(parsedArgs.in, compileOut)
      await convertFunctionToModule()
    } catch (err) {
      if (err instanceof Error) {
        console.log(`Error compiling to JS module: ${err.message}`)
      }
    } finally {
      await rm(compileOut, { force: true })
      await rm(`${compileOut}.deps`, { force: true })
    }
  }

  main()
}
