import { Db } from 'mongodb'

export async function up(db: Db): Promise<void> {
  if (!await doesCollectionExist(db, 'actionTriggers')) {
    return
  }
  await db.collection('actionTriggers').rename('triggers')
}

export async function down(db: Db): Promise<void> {
  if (!await doesCollectionExist(db, 'triggers')) {
    return
  }
  await db.collection('triggers').rename('actionTriggers')
}

async function doesCollectionExist(db: Db, collectionName: string): Promise<boolean> {
  return (await db.listCollections().toArray()).some(collection => collection.name === collectionName)
}
