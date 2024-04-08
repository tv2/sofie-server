import { parseArgs } from 'node:util'
import { readdir } from 'fs/promises'
import { docker } from './docker'

const MONGODB_PORT: string = process.env.npm_package_confg_database_port || '3001'
const MONGODB_DATABASE_NAME: string = process.env.npm_package_confg_database_name || 'meteor'


const {
  positionals,
  values
} = parseArgs({
  options: {
    help: {
      type: 'boolean',
      short: 'h',
      default: false,
    },
    latest: {
      type: 'boolean',
      default: false,
    }
  },
  strict: false,
  allowPositionals: false,
})

if (values.help) {
  console.log('Usage: npx ts-node ./db/manager/migrate.ts [option]')
  console.log('Options (use one of):')
  console.log('  -h, --help    Display this help message')
  console.log('  --latest      Migrate the database to the semantically latest schema version available in ../schema folder')

  process.exit(0)
}

async function getSchemaDirectories(parentFolderName: string): Promise<string[]> {
  return (await readdir(parentFolderName, {withFileTypes: true}))
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
    .filter(name => name.match(/^v\d+\.\d+\.\d+$/))
}

function compareVersions(a: number[], b: number[]): number {
  // v9999.9999.9999 is the latest possible version number
  const majorWeight: number = 1000 * 1000
  const minorWeight: number = 1000
  const patchWeight: number = 1

  const weightA: number = a[0] * majorWeight + a[1] * minorWeight + a[2] * patchWeight
  const weightB: number = b[0] * majorWeight + b[1] * minorWeight + b[2] * patchWeight

  if (weightA > weightB) {
    return 1
  }

  if (weightA < weightB) {
    return -1
  }

  return 0
}

function maxVersion(versions: string[]): string {
  if (!versions.length) {
    return 'v0.0.1'
  }
  const versionNumbers: number[][] = versions
    .map((version) => {
      if (!version.startsWith('v')) {
        return [-1, -1, -1]
      }

      const versionStrings: string[] = version
        .replace (/^v/,'')
        .split('.')

      if (versionStrings.length !== 3) {
        return [-1, -1, -1]
      }

      return versionStrings
        .map((versionString: string) => {
          return parseInt(versionString,10) || -1
        })
    })

  const latestVersion: number[] | undefined = versionNumbers
    .sort(compareVersions)
    .pop()

  if (!latestVersion) {
    return 'v0.0.1'
  }

  return latestVersion
    .join('.')
    .replace (/^/,'v')
}

async function getLatestSchemaVersion(): Promise<string> {
  const schemaDirectories: string[] = await getSchemaDirectories('../schema')

  return maxVersion(schemaDirectories)
}

async function migrateLatest(): Promise<void> {
  const latestVersion: string = await getLatestSchemaVersion()
  console.log('Migrating to latest schema version available:', latestVersion)
  docker([
    'exec',
    'mongo',
    'mongorestore', '--host', 'gateway.docker.internal', '--port', `${MONGODB_PORT}`, '--nsInclude', `${MONGODB_DATABASE_NAME}.*`, `./database/schema/${latestVersion}`
  ])
}

function action(values: { [longOption: string]: string | boolean | undefined } & {
  help: string | boolean | undefined
  latest: string | boolean | undefined
}): void {
  const options: string[] = Object.entries(values)
    .filter(([, isSet]) => isSet)
    .map(([argument]) => argument)

  switch (options[0]) {
    case 'start':
      console.log('starting mongo...')
      void migrateLatest().then().catch(console.error)
      break


    default:
      console.log('Please provide a valid option. Try --help for more information.')
      positionals.length > 0 && console.log('Unsupported: ', positionals)
      break
  }
}

action(values)
