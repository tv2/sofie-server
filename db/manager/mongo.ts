import { parseArgs } from 'node:util'
import { exec } from 'node:child_process'
import { MongoClient } from 'mongodb'

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
  console.log('  --dump        Dump all from mongodb://gateway.docker.internal:3001/ to ./db/dumps/meteor')

  process.exit(0)
}

function docker(args: string[]): void {
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

function initReplicaSet(): void {
  docker([
    'exec',
    'sofie-mongodb',
    'mongosh',
    '"mongodb://127.0.0.1:3001/"',
    '--quiet',
    '--eval',
    '"rs.initiate({\'_id\':\'rs0\',members:[{\'_id\':0,\'host\':\'127.0.0.1:3001\'}]})"'
  ])
}

function startMongoContainer(): void {
  if (/^win/i.test(process.platform)) {
    docker([
      'run', '--rm',
      '--name', 'sofie-mongodb',
      '-v', '.\\db\\dumps:/dumps',
      '-v', 'sofie-mongodb-data:/data/db',
      '-v', 'sofie-mongodb-config:/data/configdb',
      '-p', '3001:3001',
      // requires mongotools installed on Windows
      // '--health-cmd', '"test', '\\"echo', '\'db.stats().ok\'', '|', 'mongosh', '\\"mongodb://127.0.0.1:3001/sofie?replicaSet=rs0\\"', '--quiet\\""',
      '--health-interval=1s',
      '-d',
      'mongo:6.0.1',
      '--replSet', 'rs0',
      '--bind_ip_all',
      '--port', '3001'
    ])
  } else {
    docker([
      'run', '--rm',
      '--name', 'sofie-mongodb',
      '-v', './db/dumps:/dumps',
      '-v', 'sofie-mongodb-data:/data/db',
      '-v', 'sofie-mongodb-config:/data/configdb',
      '-p', '3001:3001',
      '--health-cmd', '"test', '\\"echo', '\'db.stats().ok\'', '|', 'mongosh', '\\"mongodb://127.0.0.1:3001/sofie?replicaSet=rs0\\"', '--quiet\\""',
      '--health-interval=1s',
      '-d',
      'mongo:6.0.1',
      '--replSet', 'rs0',
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
  void new MongoClient('mongodb://localhost:3001/sofie?replicaSet=rs0')
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
    '"mongodb://127.0.0.1:3001/?replicaSet=rs0"',
    '--oplogReplay',
    '/dumps/meteor'
  ])
}

function dumptDatabase(): void {
  if (/^win/i.test(process.platform)) {
    docker([
      'run', '--rm',
      '-v', '.\\db\\dumps:/dumps',
      'leafney/alpine-mongo-tools:latest',
      'mongodump', '--host=gateway.docker.internal', '--port=3001', '--oplog', '--out=/dumps/meteor'
    ])
  } else {
    docker([
      'run', '--rm',
      '-v', './db/dumps:/dumps',
      'leafney/alpine-mongo-tools:latest',
      'mongodump', '--host=gateway.docker.internal', '--port=3001', '--oplog', '--out=/dumps/meteor'
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
