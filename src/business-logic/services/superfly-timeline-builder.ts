import { TimelineBuilder } from './interfaces/timeline-builder'
import { Rundown } from '../../model/entities/rundown'
import {
  ActivePartTimelineObjectGroup,
  LookaheadTimelineObject,
  TimelineObject,
  TimelineObjectGroup,
} from '../../model/entities/timeline-object'
import { Part } from '../../model/entities/part'
import { Piece } from '../../model/entities/piece'
import { TimelineEnable } from '../../model/entities/timeline-enable'
import { TransitionType } from '../../model/enums/transition-type'
import { PartTimings } from '../../model/value-objects/part-timings'
import { PieceLifespan } from '../../model/enums/piece-lifespan'
import { UnsupportedOperationException } from '../../model/exceptions/unsupported-operation-exception'
import { ExhaustiveCaseChecker } from '../exhaustive-case-checker'
import { ObjectCloner } from './interfaces/object-cloner'
import { Studio } from '../../model/entities/studio'
import { StudioLayer } from '../../model/value-objects/studio-layer'
import { LookaheadMode } from '../../model/enums/lookahead-mode'
import { Exception } from '../../model/exceptions/exception'
import { ErrorCode } from '../../model/enums/error-code'
import { Timeline } from '../../model/entities/timeline'
import { MisconfigurationException } from '../../model/exceptions/misconfiguration-exception'

const BASELINE_GROUP_ID: string = 'baseline_group'
const LOOKAHEAD_GROUP_ID: string = 'lookahead_group'
const LOOKAHEAD_GROUP_ID_ACTIVE_PIECE_POST_FIX: string = '_forActive'

const ACTIVE_GROUP_PREFIX: string = 'active_group_'
const PREVIOUS_GROUP_PREFIX: string = 'previous_group_'
const INFINITE_GROUP_PREFIX: string = 'infinite_group_'
const PIECE_PRE_ROLL_PREFIX: string = 'pre_roll_'

const PIECE_CONTROL_INFIX: string = '_piece_control_'
const PIECE_GROUP_INFIX: string = '_piece_group_'

// These priority values are the same values used by Core
const HIGH_PRIORITY: number = 5
const MEDIUM_PRIORITY: number = 1
const LOOKAHEAD_PRIORITY: number = 0.1
const BASELINE_PRIORITY: number = 0
const LOW_PRIORITY: number = -1

export class SuperflyTimelineBuilder implements TimelineBuilder {
  constructor(private readonly objectCloner: ObjectCloner) {}

  public getBaseTimeline(): Timeline {
    return { timelineGroups: [] }
  }

  public async buildTimeline(rundown: Rundown, studio?: Studio): Promise<Timeline> {
    if (!studio) {
      throw new MisconfigurationException(`No Studio provided when calling ${SuperflyTimelineBuilder.name}.${SuperflyTimelineBuilder.prototype.buildTimeline.name}`)
    }

    let timeline: Timeline = this.createTimelineWithBaseline(rundown)

    if (!rundown.isActivePartSet()) {
      return Promise.resolve(this.createTimelineWithLookaheadGroup(rundown, studio, undefined, timeline))
    }

    const activePartTimelineGroup: ActivePartTimelineObjectGroup = this.createActivePartGroup(rundown)
    timeline.timelineGroups.push(activePartTimelineGroup)

    timeline = this.createTimelineWithPreviousPartGroup(rundown, activePartTimelineGroup, timeline)
    timeline = this.createTimelineWithLookaheadGroup(rundown, studio, activePartTimelineGroup, timeline)
    timeline = this.createTimelineWithInfiniteGroups(rundown, timeline)
    timeline = this.updateTimelineAutoNextEpochTimestampFromNextPart(rundown, activePartTimelineGroup, timeline)

    return Promise.resolve(timeline)
  }

  private createTimelineWithBaseline(rundown: Rundown): Timeline {
    const baselineGroup: TimelineObjectGroup = {
      id: BASELINE_GROUP_ID,
      isGroup: true,
      children: rundown.getBaseline(),
      enable: {
        while: '1',
      },
      priority: BASELINE_PRIORITY,
      layer: '',
      content: {}
    }

    return {
      timelineGroups: [baselineGroup],
    }
  }

  private createActivePartGroup(rundown: Rundown): ActivePartTimelineObjectGroup {
    const activePart: Part = rundown.getActivePart()

    const currentPartEnable: TimelineEnable = {
      start: activePart.getExecutedAt()
    }

    let autoNextEpochTime: number = 0
    if (activePart.autoNext && !!activePart.expectedDuration) {
      currentPartEnable.duration =
          activePart.expectedDuration + activePart.getTimings().delayStartOfPiecesDuration
      autoNextEpochTime = activePart.getExecutedAt() + currentPartEnable.duration
    }

    const activeGroup: ActivePartTimelineObjectGroup = {
      id: `${ACTIVE_GROUP_PREFIX}${activePart.id}`,
      priority: HIGH_PRIORITY,
      isGroup: true,
      children: [],
      enable: currentPartEnable,
      layer: '',
      autoNextEpochTime,
      content: {}
    }

    activeGroup.children = activePart
      .getPieces()
      .flatMap((piece) => this.generateGroupsAndTimelineObjectsForPiece(piece, activePart, activeGroup))
    return activeGroup
  }

  private generateGroupsAndTimelineObjectsForPiece(
    piece: Piece,
    part: Part,
    parentGroup: TimelineObjectGroup
  ): TimelineObject[] {
    const timelineObjectsToReturn: TimelineObject[] = []
    const pieceEnable: TimelineEnable | undefined = this.createTimelineEnableForPiece(part, piece, parentGroup)

    if (!pieceEnable) {
      return []
    }

    if (pieceEnable.start === 'now') {
      throw new UnsupportedOperationException(
        `Found an enable.start="now" for control for Piece: '${piece.id}'`
      )
    }

    const controlForPiece: TimelineObject = this.createTimelineObjectControl(parentGroup, piece, pieceEnable)
    timelineObjectsToReturn.push(controlForPiece)

    const childGroupForPiece: TimelineObjectGroup = this.createTimelineObjectGroupForPiece(
      parentGroup,
      piece,
      controlForPiece
    )
    timelineObjectsToReturn.push(childGroupForPiece)

    if (this.shouldPieceHavePreRollGroup(controlForPiece, piece)) {
      const preRollControlForPiece: TimelineObject = this.createPreRollGroupForControl(
        controlForPiece,
        parentGroup
      )
      timelineObjectsToReturn.push(preRollControlForPiece)

      controlForPiece.enable.start = `#${preRollControlForPiece.id} + ${piece.preRollDuration}`
    }

    childGroupForPiece.children = piece.timelineObjects.map((timelineObject) =>
      this.mapToTimelineObjectForPieceGroup(timelineObject, childGroupForPiece, piece)
    )

    return timelineObjectsToReturn
  }

  private createTimelineEnableForPiece(
    part: Part,
    piece: Piece,
    parentGroup: TimelineObjectGroup
  ): TimelineEnable | undefined {
    const partCalculatedTimings: PartTimings = part.getTimings()
    switch (piece.transitionType) {
      case TransitionType.IN_TRANSITION: {
        return this.createInTransitionTimelineEnable(partCalculatedTimings, piece)
      }
      case TransitionType.OUT_TRANSITION: {
        return this.createOutTransitionTimelineEnable(part, partCalculatedTimings, parentGroup)
      }
      case TransitionType.NO_TRANSITION: {
        return this.createNoTransitionTimelineEnable(partCalculatedTimings, piece, parentGroup)
      }
      default: {
        ExhaustiveCaseChecker.assertAllCases(piece.transitionType)
      }
    }
  }

  private createInTransitionTimelineEnable(
    partCalculatedTimings: PartTimings,
    piece: Piece
  ): TimelineEnable | undefined {
    if (partCalculatedTimings.inTransitionStart === undefined) {
      return
    }

    const startOffset: number = piece.getStart()
    return {
      start: partCalculatedTimings.inTransitionStart + startOffset,
      duration: piece.duration,
    }
  }

  private createOutTransitionTimelineEnable(
    part: Part,
    partCalculatedTimings: PartTimings,
    parentGroup: TimelineObjectGroup
  ): TimelineEnable | undefined {
    if (!part.outTransition.keepAliveDuration) {
      return
    }

    const postRollDurationPostFix: string = partCalculatedTimings.postRollDuration
      ? ` - ${partCalculatedTimings.postRollDuration}`
      : ''
    return {
      start: `#${parentGroup.id}.end - ${part.outTransition.keepAliveDuration}${postRollDurationPostFix}`,
    }
  }

  private createNoTransitionTimelineEnable(
    partCalculatedTimings: PartTimings,
    piece: Piece,
    parentGroup: TimelineObjectGroup
  ): TimelineEnable | undefined {
    const duration: string | number | undefined =
        partCalculatedTimings.postRollDuration && !piece.duration
          ? `#${parentGroup.id} - ${partCalculatedTimings.postRollDuration}`
          : piece.duration

    return {
      start: piece.getStart() + (piece.isPlanned ? partCalculatedTimings.delayStartOfPiecesDuration : 0),
      duration: duration === 0 ? undefined : duration,
    }
  }

  private createTimelineObjectControl(
    parentGroup: TimelineObjectGroup,
    piece: Piece,
    pieceEnable: TimelineEnable
  ): TimelineObject {
    return {
      id: `${parentGroup.id}${PIECE_CONTROL_INFIX}${piece.id}`,
      enable: pieceEnable,
      layer: piece.layer,
      priority: MEDIUM_PRIORITY,
      isGroup: false,
      inGroup: parentGroup.id,
      content: {}
    }
  }

  private createTimelineObjectGroupForPiece(
    parentGroup: TimelineObjectGroup,
    piece: Piece,
    controlForPiece: TimelineObject
  ): TimelineObjectGroup {
    return {
      id: `${parentGroup.id}${PIECE_GROUP_INFIX}${piece.id}`,
      isGroup: true,
      inGroup: parentGroup.id,
      children: [],
      enable: {
        start: `#${controlForPiece.id}.start${piece.preRollDuration ? ` - ${piece.preRollDuration}` : ''}`,
        end: `#${controlForPiece.id}.end${piece.postRollDuration ? ` - ${piece.postRollDuration}` : ''}`,
      },
      layer: '',
      content: {}
    }
  }

  private shouldPieceHavePreRollGroup(controlForPiece: TimelineObject, piece: Piece): boolean {
    return (controlForPiece.enable as TimelineEnable).start === 0 && piece.preRollDuration > 0
  }

  private createPreRollGroupForControl(
    controlObject: TimelineObject,
    parentGroup: TimelineObjectGroup
  ): TimelineObject {
    return {
      id: `${PIECE_PRE_ROLL_PREFIX}${controlObject.id}`,
      enable: {
        start: `#${parentGroup.id}.start`,
      },
      layer: '',
      content: {}
    }
  }

  private mapToTimelineObjectForPieceGroup(
    timelineObject: TimelineObject,
    childGroupForPiece: TimelineObjectGroup,
    piece: Piece
  ): TimelineObject {
    const timelineObjectCopy: TimelineObject = this.objectCloner.clone(timelineObject)
    timelineObjectCopy.id = `${childGroupForPiece.id}_${piece.id}_${timelineObject.id}`
    timelineObjectCopy.inGroup = childGroupForPiece.id
    return timelineObjectCopy
  }

  private createTimelineWithLookaheadGroup(
    rundown: Rundown,
    studio: Studio,
    activeGroup: TimelineObjectGroup | undefined,
    timeline: Timeline
  ): Timeline {
    const lookaheadLayers: StudioLayer[] = studio.layers.filter(
      (layer) => layer.lookaheadMode !== LookaheadMode.NONE
    )

    const lookaheadObjects: TimelineObject[] = this.findLookaheadTimelineObjectsForLayers(lookaheadLayers, rundown, activeGroup)

    const lookaheadTimelineObjectGroup: TimelineObjectGroup = {
      id: LOOKAHEAD_GROUP_ID,
      isGroup: true,
      children: lookaheadObjects,
      enable: {
        while: '1',
      },
      priority: LOOKAHEAD_PRIORITY,
      layer: '',
      content: {}
    }

    timeline.timelineGroups.push(lookaheadTimelineObjectGroup)
    return timeline
  }

  private findLookaheadTimelineObjectsForLayers(lookaheadLayers: StudioLayer[], rundown: Rundown, activeGroup: TimelineObjectGroup | undefined): TimelineObject[] {
    return lookaheadLayers.flatMap((layer) => {
      const lookaheadObjects: LookaheadTimelineObject[] = this.findLookaheadTimelineObjectsForFutureParts(
        rundown,
        layer,
        activeGroup
      )

      const activePartLookaheadObjects: LookaheadTimelineObject[] =
        this.findLookaheadTimelineObjectsForActivePart(rundown, layer, activeGroup)
      lookaheadObjects.push(...activePartLookaheadObjects)

      return lookaheadObjects
    })
  }

  private findLookaheadTimelineObjectsForFutureParts(
    rundown: Rundown,
    layer: StudioLayer,
    activeGroup: TimelineObjectGroup | undefined
  ): LookaheadTimelineObject[] {
    const lookAheadEnable: TimelineEnable = {
      while: activeGroup ? `#${activeGroup.id}` : '1',
    }
    const lookAheadObjects: LookaheadTimelineObject[] = []
    let partToGetLookAheadObjectsFrom: Part = rundown.getNextPart()

    for (let i = 0; i < layer.maximumLookaheadSearchDistance; i++) {
      if (lookAheadObjects.length >= layer.amountOfLookaheadObjectsToFind) {
        return lookAheadObjects
      }

      lookAheadObjects.push(
        ...this.createLookaheadTimelineObjectsForPart(partToGetLookAheadObjectsFrom, layer, lookAheadEnable)
      )
      try {
        partToGetLookAheadObjectsFrom = rundown.getPartAfter(partToGetLookAheadObjectsFrom)
      } catch (exception) {
        if ((exception as Exception).errorCode !== ErrorCode.LAST_PART_IN_RUNDOWN) {
          throw exception
        }
        return lookAheadObjects
      }
    }
    return lookAheadObjects
  }

  private createLookaheadTimelineObjectsForPart(
    part: Part,
    layer: StudioLayer,
    enable: TimelineEnable,
    idPostFix?: string
  ): LookaheadTimelineObject[] {
    return part
      .getPieces()
      .filter((piece) => piece.pieceLifespan === PieceLifespan.WITHIN_PART)
      .flatMap((piece) => piece.timelineObjects)
      .filter((timelineObject) => timelineObject.layer === layer.name)
      .map((timelineObject) => this.mapTimelineObjectToLookAheadTimelineObject(timelineObject, enable, layer, idPostFix))
  }

  /*
   * Since the active Part might be delayed slightly, from when the Take happens to when the active Part is actually OnAir (i.e. Pre- and PostRoll etc),
   * we need to show the lookAhead objects from the "previous next" Part which is now the active Part.
   * We only need to show these lookAhead objects until the active Part starts playing. Once that happens, the actual
   * lookAhead objects will take over.
   */
  private findLookaheadTimelineObjectsForActivePart(
    rundown: Rundown,
    layer: StudioLayer,
    activeGroup: TimelineObjectGroup | undefined
  ): LookaheadTimelineObject[] {
    if (!rundown.isActivePartSet() || !activeGroup) {
      return []
    }
    const activePartTimelineObjectEnable: TimelineEnable = {
      start: 0,
      end: `#${activeGroup.id}.start`,
    }
    return this.createLookaheadTimelineObjectsForPart(
      rundown.getActivePart(),
      layer,
      activePartTimelineObjectEnable,
      LOOKAHEAD_GROUP_ID_ACTIVE_PIECE_POST_FIX
    )
  }

  private mapTimelineObjectToLookAheadTimelineObject(
    timelineObject: TimelineObject,
    enable: TimelineEnable,
    studioLayer: StudioLayer,
    idPostFix: string = ''
  ): LookaheadTimelineObject {
    const lookAheadTimelineObject: LookaheadTimelineObject = {
      ...this.objectCloner.clone(timelineObject),
      id: `${LOOKAHEAD_GROUP_ID}_${timelineObject.id}${idPostFix}`,
      priority: LOOKAHEAD_PRIORITY,
      isLookahead: true,
      enable,
      inGroup: LOOKAHEAD_GROUP_ID,
    }
    if (studioLayer.lookaheadMode === LookaheadMode.PRELOAD) {
      lookAheadTimelineObject.lookaheadForLayer = lookAheadTimelineObject.layer
      lookAheadTimelineObject.layer = `${lookAheadTimelineObject.layer}_lookahead`
    }
    return lookAheadTimelineObject
  }

  private createTimelineWithPreviousPartGroup(
    rundown: Rundown,
    activeGroup: TimelineObjectGroup,
    timeline: Timeline
  ): Timeline {
    const previousPart: Part | undefined = rundown.getPreviousPart()
    if (!previousPart) {
      return timeline
    }

    if (previousPart.getExecutedAt() <= 0) {
      throw new UnsupportedOperationException(
        `Previous Part: ${previousPart.name} does not have a valid "executedAt" - something went wrong when setting the previous Part.`
      )
    }

    const previousGroup: TimelineObjectGroup = {
      id: `${PREVIOUS_GROUP_PREFIX}${previousPart.id}`,
      priority: LOW_PRIORITY,
      isGroup: true,
      children: [],
      enable: {
        start: previousPart.getExecutedAt(),
        end: `#${activeGroup.id}.start + ${
          rundown.getActivePart().getTimings().previousPartContinueIntoPartDuration
        }`,
      },
      layer: '',
      content: {}
    }

    previousGroup.children = previousPart
      .getPiecesWithLifespan([PieceLifespan.WITHIN_PART])
      .flatMap(piece => this.generateGroupsAndTimelineObjectsForPiece(piece, previousPart, previousGroup))

    timeline.timelineGroups.push(previousGroup)
    return timeline
  }

  private createTimelineWithInfiniteGroups(rundown: Rundown, timeline: Timeline): Timeline {
    const activePart: Part = rundown.getActivePart()
    const infinitePieceTimelineObjectGroups: TimelineObjectGroup[] = []
    rundown
      .getInfinitePieces()
      .filter(piece => piece.transitionType === TransitionType.NO_TRANSITION)
      .filter(piece => piece.getPartId() !== activePart.id)
      .forEach(piece => {
        if (!piece.getExecutedAt()) {
          throw new UnsupportedOperationException(
            `Found infinite Piece: ${piece.id} without an "executedAt". Infinite Pieces must have an "executedAt"! ${piece.pieceLifespan}`
          )
        }

        const infiniteGroup: TimelineObjectGroup = {
          id: `${INFINITE_GROUP_PREFIX}${activePart.id}_${piece.id}`,
          priority: MEDIUM_PRIORITY,
          isGroup: true,
          children: [],
          enable: {
            start: piece.getExecutedAt(),
          },
          layer: piece.layer,
          content: {}
        }

        infiniteGroup.children = piece.timelineObjects.flatMap(timelineObject => this.mapToTimelineObjectForPieceGroup(timelineObject, infiniteGroup, piece))
        infinitePieceTimelineObjectGroups.push(infiniteGroup)
      })

    timeline.timelineGroups.push(...infinitePieceTimelineObjectGroups)
    return timeline
  }

  private updateTimelineAutoNextEpochTimestampFromNextPart(
    rundown: Rundown,
    activeGroup: ActivePartTimelineObjectGroup,
    timeline: Timeline
  ): Timeline {
    const hasNoAutoNext: boolean = activeGroup.autoNextEpochTime === 0
    if (hasNoAutoNext) {
      return timeline
    }

    const activePart: Part = rundown.getActivePart()
    rundown.getNextPart().calculateTimings(activePart)
    timeline.autoNext = {
      epochTimeToTakeNext:
          activeGroup.autoNextEpochTime - rundown.getNextPart().getTimings().previousPartContinueIntoPartDuration,
    }
    return timeline
  }
}
