import { IngestService } from './interfaces/ingest-service'
import { RundownRepository } from '../../data-access/repositories/interfaces/rundown-repository'
import { Rundown } from '../../model/entities/rundown'
import { DataChangedListener } from '../../data-access/repositories/interfaces/data-changed-listener'
import { RundownEventEmitter } from './interfaces/rundown-event-emitter'
import { RundownEventBuilder } from './interfaces/rundown-event-builder'
import { SegmentCreatedEvent, SegmentDeletedEvent } from '../../model/value-objects/rundown-event'
import { SegmentRepository } from '../../data-access/repositories/interfaces/segment-repository'
import { Segment } from '../../model/entities/segment'

export class DatabaseChangeIngestService implements IngestService {

  constructor(
    private readonly rundownRepository: RundownRepository,
    private readonly segmentRepository: SegmentRepository,
    private readonly eventEmitter: RundownEventEmitter,
    private readonly eventBuilder: RundownEventBuilder,
    segmentChangedListener: DataChangedListener
  ) {
    segmentChangedListener.onCreated(segmentId => this.segmentCreated(segmentId))
    segmentChangedListener.onDeleted(segmentId => this.segmentDeleted(segmentId))
  }

  public async segmentCreated(segmentId: string): Promise<void> {
    const segment: Segment = await this.segmentRepository.getSegment(segmentId)
    const rundown: Rundown = await this.rundownRepository.getRundown(segment.rundownId)
    rundown.addSegment(segment)

    const event: SegmentCreatedEvent = this.eventBuilder.buildSegmentCreatedEvent(rundown, segment)
    this.eventEmitter.emitRundownEvent(event)

    // TODO: If the Segment belongs to an active Rundown we also need to rebuild the Timeline.

    await this.rundownRepository.saveRundown(rundown)
  }

  public async segmentDeleted(segmentId: string): Promise<void> {
    try {
      const rundown: Rundown = await this.rundownRepository.getRundownBySegmentId(segmentId)
      rundown.removeSegment(segmentId)

      const event: SegmentDeletedEvent = this.eventBuilder.buildSegmentDeletedEvent(rundown, segmentId)
      this.eventEmitter.emitRundownEvent(event)

      // TODO: If the Segment belongs to an active Rundown we also need to rebuild the Timeline.

      await this.rundownRepository.saveRundown(rundown)
    } catch (error) {
      console.error('Error while processing Segment Deleted event', error)
    }
  }
}
