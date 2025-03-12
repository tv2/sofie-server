import { Db } from 'mongodb'
export async function up(db: Db): Promise<void> {
  await db.collection('actionTriggers').updateMany({}, { $set: { type: 'ACTION'}})
}

export async function down(db: Db): Promise<void> {
  await db.collection('actionTriggers').updateMany({}, { $set: { type: ''}})
}
