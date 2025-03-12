import { Db } from 'mongodb'

export async function up(db: Db): Promise<void> {
  await db.collection('actionTriggers').rename('triggers')
}

export async function down(db: Db): Promise<void> {
  await db.collection('triggers').rename('actionTriggers')
}
