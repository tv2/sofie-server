import { DataChangedListener } from '../interfaces/data-changed-listener'
import { MongoDatabase } from './mongo-database'
import { MongoEntityConverter, MongoSegment } from './mongo-entity-converter'
import { BaseMongoRepository } from './base-mongo-repository'
import { ChangeStream, ChangeStreamDeleteDocument, ChangeStreamDocument, ChangeStreamInsertDocument } from 'mongodb'

const SEGMENT_COLLECTION_NAME: string = 'segments'

enum MongoChangeEvent {
  INSERT = 'insert',
  DELETE = 'delete',
  UPDATE = 'update',
  REPLACE = 'replace'
}

export class MongoSegmentChangedListener extends BaseMongoRepository implements DataChangedListener {

  private onCreatedCallback: (segmentId: string) => void
  private onDeletedCallback: (segmentId: string) => void

  constructor(mongoDatabase: MongoDatabase, mongoEntityConverter: MongoEntityConverter) {
    super(mongoDatabase, mongoEntityConverter)
    mongoDatabase.onConnect(SEGMENT_COLLECTION_NAME, () => this.listenForChanges())
  }

  private listenForChanges(): void {
    const options = { fullDocument: 'updateLookup' }
    const changeStream: ChangeStream = this.getCollection().watch<MongoSegment, ChangeStreamDocument<MongoSegment>>([
      // TODO: Needs a filter that only listens for changes from Core
      // {
      //   $match: {
      //   }
      // }
    ], options)
    changeStream.on('change', (change: ChangeStreamDocument<MongoSegment>) => {
      console.log(`### Got a "${change.operationType}" event!`)
      switch (change.operationType) {
        case MongoChangeEvent.INSERT: {
          console.log(change)
          const insertChange: ChangeStreamInsertDocument<MongoSegment> = change as ChangeStreamInsertDocument<MongoSegment>
          const segmentId: string = insertChange.fullDocument._id
          this.onCreatedCallback(segmentId)
          break
        }
        case MongoChangeEvent.UPDATE: {
          break
        }
        case MongoChangeEvent.DELETE: {
          console.log(change)
          const deleteChange: ChangeStreamDeleteDocument = change as ChangeStreamDeleteDocument
          const segmentId: string = deleteChange.documentKey._id as unknown as string
          this.onDeletedCallback(segmentId)
          break
        }
        case MongoChangeEvent.REPLACE: {
          break
        }
      }
    })
    console.log('### Listening for Segment collection changes...')
  }

  protected getCollectionName(): string {
    return SEGMENT_COLLECTION_NAME
  }

  public onCreated(onCreatedCallback: (segmentId: string) => void): void {
    this.onCreatedCallback = onCreatedCallback
  }

  public onDeleted(onDeletedCallback: (segmentId: string) => void): void {
    this.onDeletedCallback = onDeletedCallback
  }
}
