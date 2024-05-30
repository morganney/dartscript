#!/usr/bin/env node

import { argv } from 'node:process'
import { readFile, writeFile, rm } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import type { ParseArgsConfig } from 'node:util'

import { parse } from 'acorn'
import { simple } from 'acorn-walk'
import MagicString from 'magic-string'

import { init } from './init.js'
import { compile } from './compile.js'
import { log, getRealPathAsFileUrl } from './util.js'

export const dartscript = async (args?: ParseArgsConfig['args']) => {
  const ctx = await init(args)

  if (ctx) {
    const hex = randomBytes(4).toString('hex')
    const compileOut = `_${hex}_.js`
    const getFileContents = async () => {
      const buffer = await readFile(compileOut)

      return buffer.toString()
    }
    const writeFileContents = async (contents: string) => {
      const magic = new MagicString(contents)

      if (ctx.module === 'cjs') {
        magic.prepend(
          ctx.default ? 'module.exports = function ' : `exports.${ctx.func} = function `,
        )
      } else {
        magic.prepend(ctx.default ? 'export default function ' : 'export function ')
      }
      await writeFile(ctx.out, magic.toString())
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
                  property.key.name === ctx.func
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
          log(`Done! Saved compiled dart function to file ${ctx.out}`)
        } catch (err) {
          if (err instanceof Error) {
            log(`Unable to write compiled dart function to file: ${err.message}`)
          }
        }
      }
    }

    try {
      await compile(ctx.in, compileOut)
      await convertFunctionToModule()
    } catch (err) {
      if (err instanceof Error) {
        log(`Error compiling to JS module: ${err.message}`)
      }
    } finally {
      await rm(compileOut, { force: true })
      await rm(`${compileOut}.deps`, { force: true })
    }
  }
}
const main = async () => {
  const realFileUrlArgv1 = await getRealPathAsFileUrl(argv[1])

  if (import.meta.url === realFileUrlArgv1) {
    await dartscript()
  }
}

main()
