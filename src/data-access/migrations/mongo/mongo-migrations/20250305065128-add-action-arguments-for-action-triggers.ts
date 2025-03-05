import { Db } from 'mongodb'

export async function up(db: Db): Promise<void> {
  await db.collection('actionTriggers').updateMany(
    { type: 'ACTION' },
    {
      $set: { actionArguments: 0 }
    }
  )
}

export async function down(db: Db): Promise<void> {
  await db.collection('actionTriggers').updateMany(
    { type: 'ACTION' },
    {
      $unset: { actionArguments: '' }
    }
  )
}
