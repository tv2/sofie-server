import { parseArgs } from 'node:util'
import {exec} from 'node:child_process'
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
  console.log('Usage: mongo-manager [option]')
  console.log('Options:')
  console.log('  -h, --help    Display this help message')
  console.log('  --start       Start the mongo service')
  console.log('  --stop        Stop the mongo service')
  console.log('  --restart     Restart the mongo service')
  console.log('  --initrs      Initialize the replica set')
  console.log('  --seed        Seed the database with initial data')
  console.log('  --drop        Stop then drop the database container and its volumes')
  console.log('  --spy         Spy on database events')
  console.log('  --dump        Dump all from mongodb://127.0.0.1:3001/ to ./db/dumps/meteor')

  process.exit(0)
}

function docker(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = exec(args.join(' '))
    child.on('error', (err) => {
      reject(err)
    })
    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(code)
      }
    })
  })
}

async function testDockerIsInstalled(): Promise<void> {
  return docker(['docker', '--version'])
}

async function initReplicaSet(): Promise<void> {
  return docker([
    'docker',
    'exec',
    'sofie-mongodb',
    'mongosh',
    '"mongodb://127.0.0.1:3001/"',
    '--quiet',
    '--eval',
    '"rs.initiate({\'_id\':\'rs0\',members:[{\'_id\':0,\'host\':\'127.0.0.1:3001\'}]})"'
  ])
}

async function startMongoContainer(): Promise<void> {
  return docker([
    'docker',
    'run',
    '--name', 'sofie-mongodb',
    '-v', './db/dumps:/dumps',
    '-v', 'sofie-mongodb-data:/data/db',
    '-v', 'sofie-mongodb-config:/data/configdb',
    '-p', '3001:3001',
    '--health-cmd', '"test', '\\"echo', '\'db.stats().ok\'', '|', 'mongosh', '\\"mongodb://127.0.0.1:3001/sofie?replicaSet=rs0\\"', '--quiet\\""',
    '--health-interval=1s',
    '-d', 'mongo:6.0.1',
    '--replSet', 'rs0',
    '--bind_ip_all',
    '--port', '3001'
  ])
}

async function stopMongoContainer(): Promise<void> {
  return docker([
    'docker',
    'stop',
    'sofie-mongodb',
    '-t', '2'
  ])
}

async function restartMongoContainer(): Promise<void> {
  return docker([
    'docker',
    'restart',
    'sofie-mongodb',
    '-t','2'
  ])
}

async function dropMongoContainer(): Promise<void> {
  return docker([
    'docker',
    'rm',
    '-f', '-v',
    'sofie-mongodb',
  ])
}

async function spyOnDatabase(): Promise<void>{
  const client = new MongoClient('mongodb://localhost:3001/sofie?replicaSet=rs0')
  return client.connect().then( (client) => {
    const changeStream = client.watch()
    changeStream.on('change', (change) => console.dir(change))
  })
}

async function seedDatabase(): Promise<void>{
  // Seed the database with content from ./db/dumps/meteor
  return docker([
    'docker',
    'exec',
    'sofie-mongodb',
    'mongorestore',
    '"mongodb://127.0.0.1:3001/?replicaSet=rs0"',
    '--oplogReplay',
    '/dumps/meteor'
  ])
}

async function dumptDatabase(): Promise<void>{
  const args = [
    'docker', 'run', '--rm', '-it' ,
    '-v', './db/dumps:/dumps',
    'leafney/alpine-mongo-tools:latest',
    'mongodump', '--host=gateway.docker.internal', '--port=3001', '--oplog', '--out=/dumps/meteor'
  ]
  console.log(args.join(' '))
  return docker(args)
}

async function action(values: { [longOption: string]: string | boolean | undefined } & {
  help: string | boolean | undefined
  start: string | boolean | undefined
  stop: string | boolean | undefined
  restart: string | boolean | undefined
  initrs: string | boolean | undefined
  seed: string | boolean | undefined
  drop: string | boolean | undefined
  spy: string | boolean | undefined
  dump: string | boolean | undefined
}): Promise<void> {
  switch (true) {
    case values.start && !values.stop && !values.restart && !values.initrs && !values.seed && !values.drop && !values.spy && !values.dump:
      console.log('starting mongo...')
      await testDockerIsInstalled()
      await startMongoContainer()
      break

    case values.stop && !values.start && !values.restart && !values.initrs && !values.seed && !values.drop && !values.spy && !values.dump:
      console.log('stopping mongo...')
      await testDockerIsInstalled()
      await stopMongoContainer()
      break

    case values.restart && !values.start && !values.stop && !values.initrs && !values.seed && !values.drop && !values.spy && !values.dump:
      console.log('restarting mongo...')
      await testDockerIsInstalled()
      await restartMongoContainer()
      break

    case values.initrs && !values.start && !values.stop && !values.restart && !values.seed && !values.drop && !values.spy && !values.dump:
      console.log('initializing replica set...')
      await testDockerIsInstalled()
      await initReplicaSet()
      break

    case values.seed && !values.start && !values.stop && !values.restart && !values.initrs && !values.drop && !values.spy && !values.dump:
      console.log('seeding database...')
      await testDockerIsInstalled()
      await seedDatabase()
      break

    case values.drop && !values.start && !values.stop && !values.restart && !values.initrs && !values.seed && !values.spy && !values.dump:
      console.log('dropping database...')
      await testDockerIsInstalled()
      await dropMongoContainer()
      break

    case values.spy && !values.start && !values.stop && !values.restart && !values.initrs && !values.seed && !values.drop && !values.dump:
      console.log('spying on the database...')
      await testDockerIsInstalled()
      await spyOnDatabase()
      break

    case values.dump && !values.start && !values.stop && !values.restart && !values.initrs && !values.seed && !values.drop && !values.spy:
      console.log('dumping database...')
      await testDockerIsInstalled()
      await dumptDatabase()
      break

    default:
      console.log('Please provide a valid option. Try --help for more information.')
      positionals.length > 0 && console.log('Unsupported: ', positionals)
      break
  }
}

function translateCode(e: string): string {
  switch (true){
    case (e === '125'):
      return 'There is already a running container.'
  }

  return `Unknown: ${e}`
}

action(values).then(
  () => {},
  (e) => {
    console.error(translateCode(e.toString()))
  }
).catch( e => console.error(translateCode(e)))
