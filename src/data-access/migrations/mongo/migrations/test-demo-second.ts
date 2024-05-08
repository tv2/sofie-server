import * as mongodb from 'mongodb'

module.exports = {
  async up(db: mongodb.Db): Promise<void> {
    await db.collection('executedRundowns').updateOne({ name: 'Test' }, { $set: { name: 'Hello World' }})
  },

  async down(db: mongodb.Db): Promise<void> {
    await db.collection('executedRundowns').updateOne({ name: 'Hello World' }, { $set: { name: 'Test' }})
  }
}
