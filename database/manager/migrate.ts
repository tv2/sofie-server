import { readdir } from 'fs/promises'
import * as fs from 'fs'
import {
  Db,
  Document,
  Filter,
  MongoClient,
  MongoClientOptions,
  OptionalId,
  ServerApiVersion
} from 'mongodb'


const MONGODB_PORT: string = process.env.MONGODB_PORT || '3001'
const MONGODB_HOST: string = process.env.MONGODB_HOST || 'gateway.docker.internal'
const MONGODB_REPLICA: string = process.env.MONGODB_REPLICA || 'rs0'
const MONGODB_DATABASE_NAME: string = process.env.MONGODB_DATABASE_NAME || 'meteor'
const VERSION: string = process.env.VERSION || 'v0.0.0'

console.log('')
console.log('Runner:')
console.log(`migrating to version ${VERSION}`)
console.log('environment:')
console.dir(process.env)

interface CollectionPair {
  source: Filter<Document>
  destination: Filter<Document>
}

interface WaveCopier {
  field: string
  to: string
  matcher: CollectionPair
}

interface DropDetails {
  name: string
  options: object | undefined
}

interface MigrationData {
  define: object | undefined
  extend: object | undefined
  copy: WaveCopier  | undefined
  remove: object | undefined
  drop: DropDetails | undefined
  insert: object[] | undefined
}

function getConnectedMongoClient(): Promise<MongoClient> {
  const url: string = `mongodb://${MONGODB_HOST}:${MONGODB_PORT}/?replicaSet=${MONGODB_REPLICA}&directConnection=true&serverSelectionTimeoutMS=2000`
  const options: MongoClientOptions = {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  }

  return new MongoClient(url, options).connect()
}

async function waveDefine(db: Db, collection: string, definition: object): Promise<void> {
  await db
    .createCollection(
      collection,
      {
        validator: {$jsonSchema: definition},
        validationAction: 'error',
      }
    )
    .then(c => console.dir(c))
    .catch(e => console.error(e))
}

async function waveExtend(db: Db, collection: string, extension: object): Promise<void> {
  await db
    .command(
      {
        collMod: collection,
        validator: {$jsonSchema: extension},
        validationAction: 'error',
      } as Document
    )
    .then(c => console.dir(c))
    .catch(e => console.error(e))
}


async function waveCopy(db: Db, collection: string, copy: WaveCopier): Promise<void> {
  await db
    .collection(collection)
    .find(copy.matcher?.source)
    .stream({transform: document => document[copy.field]})
    .toArray()
    .then(
      async documents => {
        await db
          .collection(copy.to)
          .updateMany(
            copy.matcher.destination,
            {$set: {[copy.field]: documents}},
            {upsert: false}
          )
          .then(c => console.dir(c))
          .catch(e => console.error(e))
      },
    )
    .then(c => console.dir(c))
    .catch(e => console.error(e))
}

async function waveRemove(db: Db, collection: string, removal: object): Promise<void> {
  await db
    .command(
      {
        collMod: collection,
        validator: {$jsonSchema: removal},
        validationAction: 'error',
      } as Document
    )
    .then(c => console.dir(c))
    .catch(e => console.error(e))
}

async function waveDrop(db: Db, collection: string, dropping: DropDetails): Promise<void> {
  if (dropping.name === collection) {
    await db
      .collection(collection)
      .drop(dropping.options)
      .then(c => console.dir(c))
      .catch(e => console.error(e))
  }
}

async function waveInsert(db: Db, collection: string, inserts: object[]): Promise<void> {
  console.dir(inserts)
  if (inserts.length > 0) {
    await db
      .collection(collection)
      .insertMany(inserts as OptionalId<Document>[])
      .then(c => console.dir(c))
      .catch(e => console.error(e))
  }
}


async function processMigrationData(db: Db, wave: string, collection: string, migrationData: MigrationData): Promise<void> {
  // d-e-c-r-d-i or de-x-co-re-rd-i sound a like
  // A. define/create new collection
  // B. extend/add fields to existing collections (same as D)
  // C. duplicate/copy fields with data 'to collection' using 1:1 matcher
  // D. remove fields that are not described in the version (same as B)
  // E. drop collections that are described 'to be removed'
  // F. insert data
  console.log(` - applying migration wave ${wave} for collection ${collection}...`)

  switch (true) {
    case wave === 'define' && migrationData.define !== undefined:
      await waveDefine(db, collection, migrationData.define)
      break

    case wave === 'extend' && migrationData.extend !== undefined:
      await waveExtend(db, collection, migrationData.extend)
      break

    case wave === 'copy' && migrationData.copy !== undefined:
      await waveCopy(db, collection, migrationData.copy)
      break

    case wave === 'remove' && migrationData.remove !== undefined:
      await waveRemove(db, collection, migrationData.remove)
      break

    case wave === 'drop' && migrationData.drop !== undefined:
      await waveDrop(db, collection, migrationData.drop)
      break

    case wave === 'insert' && migrationData.insert !== undefined:
      await waveInsert(db, collection, migrationData.insert)
      break
  }
}

async function processMigrationFle(db: Db, collectionFile: fs.Dirent, waveStep: string): Promise<void> {
  const collectionName: string = collectionFile.name.replace(/.json$/, '')
  const fileContent: string = fs.readFileSync(
    `${collectionFile.path}/${collectionFile.name}`,
    {encoding: 'utf-8'}
  )

  const migrationData: MigrationData = JSON.parse(fileContent)
  if (migrationData === undefined) {
    return
  }

  if (migrationData[waveStep] !== undefined) {
    await processMigrationData(db, waveStep, collectionName, migrationData)
  }
}

async function getMigrationData(): Promise<void> {
  const jsonFiles: fs.Dirent[] = (await readdir(
    `/schema/${VERSION}`,
    {withFileTypes: true, recursive: false},
  ))
    .filter(dirent => dirent.isFile() && dirent.name.endsWith('.json'))

  return getConnectedMongoClient().then( async client => {
    const db: Db = client.db(MONGODB_DATABASE_NAME)

    const waves: string[] = ['define', 'extend', 'copy', 'remove', 'drop', 'insert']
    for (const waveStep of waves) {
      for (const collectionFile of jsonFiles) {
        await processMigrationFle(db, collectionFile, waveStep)
      }
    }

    await client.close()
  })
}

getMigrationData().then(
  () => console.log('done!'),
).catch(e => console.error(e))
