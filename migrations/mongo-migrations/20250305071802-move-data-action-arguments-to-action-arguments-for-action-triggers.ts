import { Db } from 'mongodb'

export async function up(db: Db): Promise<void> {
  await db.collection('actionTriggers').updateMany(
    { 'data.actionArguments': { $exists: true } },
    [
      {
        $set: {
          actionArguments: '$data.actionArguments',
        }
      },
      {
        $unset: ['data.actionArguments']
      }
    ]
  )
}

export async function down(db: Db): Promise<void> {
  await db.collection('actionTriggers').updateMany(
    { actionArguments: { $exists: true } },
    [
      {
        $set: { 'data.actionArguments': '$actionArguments' }
      },
      {
        $unset: ['actionArguments']
      }
    ]
  )
}
