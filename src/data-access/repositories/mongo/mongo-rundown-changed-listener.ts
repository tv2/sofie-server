import { BaseMongoRepository } from './base-mongo-repository'
import { DataChangedListener } from '../interfaces/data-changed-listener'
import { Rundown } from '../../../model/entities/rundown'
import {
  ChangeStream,
  ChangeStreamDeleteDocument,
  ChangeStreamDocument,
  ChangeStreamInsertDocument,
  ChangeStreamOptions,
  ChangeStreamReplaceDocument
} from 'mongodb'
import { MongoEntityConverter, MongoRundown, MongoSegment } from './mongo-entity-converter'
import { MongoDatabase } from './mongo-database'
import { MongoChangeEvent } from './mongo-enums'
import { RundownRepository } from '../interfaces/rundown-repository'
import { TimelineObject } from '../../../model/entities/timeline-object'
import { Piece } from '../../../model/entities/piece'
import { Segment } from '../../../model/entities/segment'
import { RundownBaselineRepository } from '../interfaces/rundown-baseline-repository'
import { PieceRepository } from '../interfaces/piece-repository'
import { SegmentRepository } from '../interfaces/segment-repository'

const RUNDOWN_COLLECTION_NAME: string = 'rundowns'

export class MongoRundownChangedListener extends BaseMongoRepository implements DataChangedListener<Rundown> {

  private onCreatedCallback: (rundown: Rundown) => void
  private onUpdatedCallback: (rundown: Rundown) => void
  private onDeletedCallback: (rundownId: string) => void

  constructor(
    mongoDatabase: MongoDatabase,
    mongoEntityConverter: MongoEntityConverter,
    private readonly rundownRepository: RundownRepository,
    private readonly rundownBaselineRepository: RundownBaselineRepository,
    private readonly segmentRepository: SegmentRepository,
    private readonly pieceRepository: PieceRepository
  ) {
    super(mongoDatabase,mongoEntityConverter)
    mongoDatabase.onConnect(RUNDOWN_COLLECTION_NAME, () => this.listenForChanges())
  }

  protected getCollectionName(): string {
    return RUNDOWN_COLLECTION_NAME
  }

  private listenForChanges(): void {
    const options: ChangeStreamOptions = { fullDocument: 'updateLookup' }
    const changeStream: ChangeStream = this.getCollection().watch<MongoSegment, ChangeStreamDocument<MongoSegment>>([], options)
    changeStream.on('change', (change: ChangeStreamDocument<MongoRundown>) => void this.onChange(change))
    console.debug('### Listening for Rundown collection changes...')
  }

  private async onChange(change: ChangeStreamDocument<MongoRundown>): Promise<void> {
    switch (change.operationType) {
      case MongoChangeEvent.INSERT: {
        const insertChange: ChangeStreamInsertDocument<MongoRundown> = change as ChangeStreamInsertDocument<MongoRundown>
        const rundownId: string = insertChange.fullDocument._id
        const rundown: Rundown = await this.rundownRepository.getRundown(rundownId)
        this.onCreatedCallback(rundown)
        break
      }
      case MongoChangeEvent.REPLACE: {
        const replaceChange: ChangeStreamReplaceDocument<MongoRundown> = change as ChangeStreamReplaceDocument<MongoRundown>
        const mongoRundown: MongoRundown = replaceChange.fullDocument
        const rundownId: string = mongoRundown._id
        const baselineTimelineObjects: TimelineObject[] = await this.rundownBaselineRepository.getRundownBaseline(
          rundownId
        )
        const infinitePieces: Piece[] = await this.pieceRepository.getPiecesFromIds(mongoRundown.infinitePieceIds)
        const segments: Segment[] = await this.segmentRepository.getSegments(rundownId)
        const rundown: Rundown = this.mongoEntityConverter.convertRundown(mongoRundown, segments, baselineTimelineObjects, infinitePieces)
        this.onUpdatedCallback(rundown)
        break
      }
      case MongoChangeEvent.DELETE: {
        const deleteChange: ChangeStreamDeleteDocument<MongoRundown> = change as ChangeStreamDeleteDocument<MongoRundown>
        const rundownId: string = deleteChange.documentKey._id
        this.onDeletedCallback(rundownId)
        break
      }
    }
  }

  public onCreated(onCreatedCallback: (data: Rundown) => void): void {
    this.onCreatedCallback = onCreatedCallback
  }

  public onDeleted(onDeletedCallback: (id: string) => void): void {
    this.onDeletedCallback = onDeletedCallback
  }

  public onUpdated(onUpdatedCallback: (data: Rundown) => void): void {
    this.onUpdatedCallback = onUpdatedCallback
  }
}
