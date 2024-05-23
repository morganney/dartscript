import { spawn } from 'node:child_process'

export const compile = (filename: string, out: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    const args = [
      'compile',
      'js',
      '--no-source-maps',
      '--omit-implicit-checks',
      '-o',
      out,
      filename,
    ]
    const compilation = spawn('dart', args, { stdio: 'inherit' })

    compilation.on('error', err => {
      reject(new Error(`Failed to compile: ${err.message}`))
    })
    compilation.on('exit', code => {
      if (code && code > 0) {
        return reject(new Error(code.toString()))
      }

      resolve(code ?? 0)
    })
  })
}
