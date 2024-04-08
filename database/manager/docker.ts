import {exec} from 'node:child_process'

export function docker(args: string[]): void {
  if (args.length === 0) {
    throw new Error('No arguments provided to docker command')
  }

  exec(
    ['docker']
      .concat(args)
      .join(' '),
    (error, stdout, stderr) => {
      if (error) {
        console.error(stderr)
        process.exit(error.code || 1)
      }
      console.log(stdout)
    }
  )
}
