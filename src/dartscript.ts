#!/usr/bin/env node

import { parseArgs } from 'node:util'
import { readFile, writeFile } from 'node:fs/promises'

import { parse } from 'acorn'
import { simple } from 'acorn-walk'
import MagicString from 'magic-string'

type ParsedArgs = {
  in: string
  out: string
  module: 'es' | 'cjs'
  default: boolean
  identifier: string
}
let parsedArgs: ParsedArgs | null = null

try {
  const { values, positionals } = parseArgs({
    options: {
      in: {
        type: 'string',
        short: 'i',
        default: 'out.js',
      },
      out: {
        type: 'string',
        short: 'o',
        default: 'jsout.js',
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
    throw new Error('Function name is required.')
  }

  parsedArgs = {
    ...(values as Omit<ParsedArgs, 'identifier'>),
    identifier: positionals[0],
  }
} catch (err) {
  if (err instanceof Error) {
    console.log(err.message)
  }
}

if (parsedArgs) {
  const getFileContents = async () => {
    const buffer = await readFile(parsedArgs.in)

    return buffer.toString()
  }
  const writeFileContents = async (contents: string) => {
    const magic = new MagicString(contents)

    if (parsedArgs.module === 'cjs') {
      magic.prepend(
        parsedArgs.default
          ? 'module.exports = function '
          : `exports.${parsedArgs.identifier} = function `,
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
        // dart compile js -O0 produces the named function as part of an object expression
        ObjectExpression(node) {
          node.properties.forEach(property => {
            if (property.type === 'Property') {
              if (
                property.key.type === 'Identifier' &&
                property.key.name === parsedArgs.identifier
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

  convertFunctionToModule()
}
