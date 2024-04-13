import { parseArgs } from 'node:util'
import { MongoClient } from 'mongodb'
import { docker } from './docker'
import {readdir} from 'fs/promises'

const MONGODB_VERSION: string = process.env.npm_package_confg_database_version || '6.0.1'
const MONGODB_PORT: string = process.env.npm_package_confg_database_port || '3001'
const MONGODB_HOST: string = process.env.npm_package_confg_database_host || 'gateway.docker.internal'
const MONGODB_REPLICA: string = process.env.npm_package_confg_database_replica || 'rs0'
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
    start: {
      type: 'boolean',
      default: false,
    },
    stop: {
      type: 'boolean',
      default: false
    },
    restart: {
      type: 'boolean',
      default: false,
    },
    initrs: {
      type: 'boolean',
      default: false,
    },
    seed: {
      type: 'boolean',
      default: false,
    },
    drop: {
      type: 'boolean',
      default: false,
    },
    spy: {
      type: 'boolean',
      default: false,
    },
    dump: {
      type: 'boolean',
      default: false,
    },
    latest: {
      type: 'boolean',
      default: false,
    },
    rebuild: {
      type: 'boolean',
      default: false,
    }
  },
  strict: false,
  allowPositionals: false,
})

if (values.help) {
  console.log('Usage: npx ts-node ./db/manager/mongo.ts [option]')
  console.log('Options (use one of):')
  console.log('  -h, --help    Display this help message')
  console.log('  --start       Start the mongo service')
  console.log('  --stop        Stop the mongo service')
  console.log('  --restart     Restart the mongo service')
  console.log('  --initrs      Initialize the replica set')
  console.log('  --seed        Seed the database with initial data')
  console.log('  --drop        Stop then drop the database container and its volumes')
  console.log('  --spy         Spy on database events')
  console.log(`  --dump        Dump all from mongodb://gateway.docker.internal:${MONGODB_PORT}/ to ./db/dumps/meteor`)
  console.log('  --rebuild     Rebuild the migration runner container image')
  console.log('  --latest      Migrate the database to the semantically latest schema version available in ../schema folder')


  process.exit(0)
}

function initReplicaSet(): void {
  docker([
    'exec',
    'sofie-mongodb',
    'mongosh',
    '--host', `${MONGODB_HOST}`,
    '--port', `${MONGODB_PORT}`,
    '--quiet',
    '--eval',
    `"rs.initiate({'_id':'rs0',members:[{'_id':0,'host':'${MONGODB_HOST}:${MONGODB_PORT}'}]})"`
  ])
}

function startMongoContainer(): void {
  if (/^win/i.test(process.platform)) {
    docker([
      'run', '--rm',
      '--name', 'sofie-mongodb',
      '-v', '.\\database\\dumps:/dumps',
      '-v', 'sofie-mongodb-data:/data/db',
      '-v', 'sofie-mongodb-config:/data/configdb',
      '-p', `${MONGODB_PORT}:27017`,
      '-d',
      `mongo:${MONGODB_VERSION}`,
      '--replSet', `${MONGODB_REPLICA}`,
      '--bind_ip_all',
      '--port', '27017'
    ])
  } else {
    docker([
      'run', '--rm',
      '--name', 'sofie-mongodb',
      '-v', './database/dumps:/dumps',
      '-v', 'sofie-mongodb-data:/data/db',
      '-v', 'sofie-mongodb-config:/data/configdb',
      '-p', `${MONGODB_PORT}:27017`,
      '-d',
      `mongo:${MONGODB_VERSION}`,
      '--replSet', `${MONGODB_REPLICA}`,
      '--bind_ip_all',
      '--port', '27017'
    ])
  }
}

function stopMongoContainer(): void {
  docker([
    'stop',
    'sofie-mongodb',
    '-t', '2'
  ])
}

function restartMongoContainer(): void {
  docker([
    'restart',
    'sofie-mongodb',
    '-t','2'
  ])
}

function dropMongoContainer(): void {
  docker([
    'rm', '-f', '-v',
    'sofie-mongodb',
  ])
}

function spyOnDatabase(): void {
  void new MongoClient(`mongodb://localhost:${MONGODB_PORT}/${MONGODB_DATABASE_NAME}?replicaSet=${MONGODB_REPLICA}`)
    .connect().then( (client) => {
      const changeStream = client.watch()
      changeStream.on('change', (change) => console.dir(change))
    })
}

function seedDatabase(): void {
  // Seed the database with content from ./db/dumps/meteor
  docker([
    'exec',
    'sofie-mongodb',
    'mongorestore',
    `"mongodb://${MONGODB_HOST}:${MONGODB_PORT}/?replicaSet=${MONGODB_REPLICA}"`,
    '--oplogReplay',
    '/dumps/meteor'
  ])
}

function dumptDatabase(): void {
  if (/^win/i.test(process.platform)) {
    docker([
      'run', '--rm',
      '-v', '.\\database\\dumps:/dumps',
      'leafney/alpine-mongo-tools:latest',
      'mongodump', '--host=gateway.docker.internal', `--port=${MONGODB_PORT}`, '--oplog', '--out=/dumps/meteor'
    ])
  } else {
    docker([
      'run', '--rm',
      '-v', './database/dumps:/dumps',
      'leafney/alpine-mongo-tools:latest',
      'mongodump', '--host=gateway.docker.internal', `--port=${MONGODB_PORT}`, '--oplog', '--out=/dumps/meteor'
    ])
  }
}

async function getSchemaDirectories(parentFolderName: string): Promise<string[]> {
  return (await readdir(parentFolderName, {withFileTypes: true, recursive: false}))
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
    return 'v0.0.0'
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
          const parsedNumber = parseInt(versionString,10)
          if(isNaN(parsedNumber)) {
            return -1
          }

          return parsedNumber
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
  const schemaDirectories: string[] = await getSchemaDirectories('./database/schema/')

  return maxVersion(schemaDirectories)
}

async function migrateLatest(): Promise<void> {
  const latestVersion: string = await getLatestSchemaVersion()
  console.log(`Latest schema version available is discovered to be ${latestVersion}`)
  docker([
    'run', '--rm', '--name', 'runner',
    '-v', './database/schema:/schema',
    '-e', `VERSION=${latestVersion}`,
    '-e', `MONGODB_HOST=${MONGODB_HOST}`,
    '-e', `MONGODB_PORT=${MONGODB_PORT}`,
    '-e', `MONGODB_REPLICA=${MONGODB_REPLICA}`,
    '-e', `MONGODB_DATABASE_NAME=${MONGODB_DATABASE_NAME}`,
    'runner:v1'
  ])
}

function action(values: { [longOption: string]: string | boolean | undefined } & {
  help: string | boolean | undefined
  start: string | boolean | undefined
  stop: string | boolean | undefined
  restart: string | boolean | undefined
  initrs: string | boolean | undefined
  seed: string | boolean | undefined
  drop: string | boolean | undefined
  spy: string | boolean | undefined
  dump: string | boolean | undefined
  rebuild: string | boolean | undefined
  latest: string | boolean | undefined
}): void {
  const options: string[] = Object.entries(values)
    .filter(([, isSet]) => isSet)
    .map(([argument]) => argument)

  switch (options[0]) {
    case 'start':
      console.log('starting mongo...')
      startMongoContainer()
      break

    case 'stop':
      console.log('stopping mongo...')
      stopMongoContainer()
      break

    case 'restart':
      console.log('restarting mongo...')
      restartMongoContainer()
      break

    case 'initrs':
      console.log('initializing replica set...')
      initReplicaSet()
      break

    case 'seed':
      console.log('seeding database...')
      seedDatabase()
      break

    case 'drop':
      console.log('dropping database...')
      dropMongoContainer()
      break

    case 'spy':
      console.log('spying on the database...')
      spyOnDatabase()
      break

    case 'dump':
      console.log('dumping database...')
      dumptDatabase()
      break

    case 'latest':
      console.log('manage migration runner...')
      void migrateLatest().then(
        () => console.log('manage migration runner complete')
      ).catch(console.error)
      break

    case 'rebuild':
      console.log('rebuilding migration runner container image...')
      docker([
        'buildx',
        'build',
        '-f', './database/manager/runner/Dockerfile',
        '-t', 'runner:v1',
        '.',
      ])
      break

    default:
      console.log('Please provide a valid option. Try --help for more information.')
      positionals.length > 0 && console.log('Unsupported: ', positionals)
      break
  }
}

action(values)
