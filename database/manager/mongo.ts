import { parseArgs } from 'node:util'
import { MongoClient } from 'mongodb'
import { docker } from './docker'

const MONGODB_VERSION: string = process.env.npm_package_confg_database_version || '6.0.1'
const MONGODB_PORT: string = process.env.npm_package_confg_database_port || '3001'
const MONGODB_HOST: string = process.env.npm_package_confg_database_host || '127.0.0.1'
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
  console.log('  --dump        Dump all from mongodb://gateway.docker.internal:${MONGODB_HOST}/ to ./db/dumps/meteor')

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
    '"rs.initiate({\'_id\':\'rs0\',members:[{\'_id\':0,\'host\':\'${MONGODB_HOST}:${MONGODB_HOST}\'}]})"'
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
      '-p', `${MONGODB_PORT}:3001`,
      '-d',
      `mongo:${MONGODB_VERSION}`,
      '--replSet', `${MONGODB_REPLICA}`,
      '--bind_ip_all',
      '--port', '3001'
    ])
  } else {
    docker([
      'run', '--rm',
      '--name', 'sofie-mongodb',
      '-v', './database/dumps:/dumps',
      '-v', 'sofie-mongodb-data:/data/db',
      '-v', 'sofie-mongodb-config:/data/configdb',
      '-p', `${MONGODB_PORT}:3001`,
      '-d',
      `mongo:${MONGODB_VERSION}`,
      '--replSet', `${MONGODB_REPLICA}`,
      '--bind_ip_all',
      '--port', '3001'
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

    default:
      console.log('Please provide a valid option. Try --help for more information.')
      positionals.length > 0 && console.log('Unsupported: ', positionals)
      break
  }
}

action(values)
