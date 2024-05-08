import * as mongodb from 'mongodb'

module.exports = {
  async up(db: mongodb.Db): Promise<void> {
    await db.collection('executedRundowns').updateOne({ name: 'NYHEDERNE-TEST.SOFIE.RKLI' }, { $set: { name: 'Test' } })
  },

  async down(db: mongodb.Db): Promise<void> {
    await db.collection('executedRundowns').updateOne({ name: 'Test' }, { $set: { name: 'NYHEDERNE-TEST.SOFIE.RKLI' } })
  }
}
