import { Db } from 'mongodb'

export async function up(db: Db): Promise<void> {
  await db.collection('actionTriggers').updateMany(
    { type: 'ACTION' },
    [
      {
        $unset: ['data.actionArguments']
      }
    ]
  )
}

export async function down(db: Db): Promise<void> {
  await db.collection('actionTriggers').updateMany(
    { type: 'ACTION' },
    [
      {
        $set: { 'data.actionArguments': '$actionArguments' }
      }
    ]
  )
}
