import { Segment, SegmentInterface } from '../segment'
import { Part, PartInterface } from '../part'
import { Piece, PieceInterface } from '../piece'
import { PieceLifespan } from '../../enums/piece-lifespan'
import { Rundown, RundownInterface } from '../rundown'
import { anything, instance, mock, when } from '@typestrong/ts-mockito'
import { TransitionType } from '../../enums/transition-type'
import { PartTimings } from '../../value-objects/part-timings'
import { Tv2OutputLayer } from '../../../blueprints/tv2/enums/tv2-output-layer'

export class EntityMockFactory {
  public static createRundown(rundownInterface?: Partial<RundownInterface>): Rundown {
    const mockedRundown: Rundown = this.createRundownMock(rundownInterface)
    return instance(mockedRundown)
  }

  public static createRundownMock(rundownInterface?: Partial<RundownInterface>): Rundown {
    if (!rundownInterface) {
      rundownInterface = {} as RundownInterface
    }

    const mockedRundown: Rundown = mock(Rundown)

    when(mockedRundown.id).thenReturn(rundownInterface.id ?? 'rundownId')
    when(mockedRundown.name).thenReturn(rundownInterface.name ?? 'rundownName')
    when(mockedRundown.isActive()).thenReturn(rundownInterface.isRundownActive ?? false)
    when(mockedRundown.getLastTimeModified()).thenReturn(rundownInterface.modifiedAt ?? 0)
    when(mockedRundown.getSegments()).thenReturn(rundownInterface.segments ?? [])

    when(mockedRundown.getBaseline()).thenReturn(rundownInterface.baselineTimelineObjects ?? [])
    when(mockedRundown.getPartAfter(anything())).thenReturn(this.createPart())

    return mockedRundown
  }

  public static createActiveRundown(
    activeRundownProperties: {
      activePart?: Part
      nextPart?: Part
      previousPart?: Part
      activeSegment?: Segment
      nextSegment?: Segment
      infinitePieces?: Piece[]
    } = {},
    rundownInterface?: Partial<RundownInterface>
  ): Rundown {
    const mockedRundown: Rundown = this.createActiveRundownMock(activeRundownProperties, rundownInterface)
    return instance(mockedRundown)
  }

  public static createActiveRundownMock(
    activeRundownProperties: {
      activePart?: Part
      nextPart?: Part
      previousPart?: Part
      activeSegment?: Segment
      nextSegment?: Segment
      infinitePieces?: Piece[]
    } = {},
    rundownInterface?: Partial<RundownInterface>
  ): Rundown {
    const mockedRundown: Rundown = this.createRundownMock({ ...rundownInterface, isRundownActive: true })
    when(mockedRundown.getActivePart()).thenReturn(activeRundownProperties.activePart ?? this.createPart())
    when(mockedRundown.getNextPart()).thenReturn(activeRundownProperties.nextPart ?? this.createPart())
    when(mockedRundown.getPreviousPart()).thenReturn(activeRundownProperties.previousPart ?? undefined)
    when(mockedRundown.getActiveSegment()).thenReturn(activeRundownProperties.activeSegment ?? this.createSegment())
    when(mockedRundown.getNextSegment()).thenReturn(activeRundownProperties.nextSegment ?? this.createSegment())
    when(mockedRundown.getInfinitePieces()).thenReturn(activeRundownProperties.infinitePieces ?? [])
    when(mockedRundown.isActivePartSet()).thenReturn(true)

    return mockedRundown
  }

  public static createSegment(
    segmentInterface?: Partial<SegmentInterface>,
    misc?: {
      firstPart?: Part
      nextPart?: Part
      firstSpanningPieceForEachLayerBeforePart?: Piece[]
      firstSpanningRundownPieceForEachLayerForAllParts?: Piece[]
    }
  ): Segment {
    const mockedSegment: Segment = this.createSegmentMock(segmentInterface, misc)
    return instance(mockedSegment)
  }

  public static createSegmentMock(
    segmentInterface?: Partial<SegmentInterface>,
    misc?: Partial<{
      firstPart?: Part
      nextPart?: Part
      firstSpanningPieceForEachLayerBeforePart?: Piece[]
      firstSpanningRundownPieceForEachLayerForAllParts?: Piece[]
    }>
  ): Segment {
    const mockedSegment: Segment = mock(Segment)

    if (!segmentInterface) {
      segmentInterface = {} as SegmentInterface
    }

    if (!misc) {
      misc = {}
    }

    when(mockedSegment.id).thenReturn(segmentInterface.id ?? 'segmentId')
    when(mockedSegment.name).thenReturn(segmentInterface.name ?? 'segmentName')
    when(mockedSegment.isNext()).thenReturn(segmentInterface.isNext ?? false)
    when(mockedSegment.isOnAir()).thenReturn(segmentInterface.isOnAir ?? false)
    when(mockedSegment.rank).thenReturn(segmentInterface.rank ?? 1)
    when(mockedSegment.rundownId).thenReturn(segmentInterface.rundownId ?? 'rundownId')
    when(mockedSegment.getParts()).thenReturn(segmentInterface.parts ?? [])

    when(mockedSegment.findFirstPart()).thenReturn(
      misc.firstPart ?? this.createPart({ id: 'firstPartId' } as PartInterface)
    )
    when(mockedSegment.findNextPart(anything())).thenReturn(
      misc.nextPart ?? this.createPart({ id: 'nextPartId' } as PartInterface)
    )
    when(mockedSegment.getFirstSpanningPieceForEachLayerBeforePart(anything(), anything())).thenReturn(
      misc.firstSpanningPieceForEachLayerBeforePart ?? []
    )
    when(mockedSegment.getFirstSpanningRundownPieceForEachLayerForAllParts(anything())).thenReturn(
      misc.firstSpanningRundownPieceForEachLayerForAllParts ?? []
    )

    return mockedSegment
  }

  public static createPart(
    partInterface?: Partial<PartInterface>,
    misc?: {
      partTimings?: Partial<PartTimings>
      executedAt?: number
      piecesWithLifespanFilters?: Piece[]
    }
  ): Part {
    const mockedPart: Part = this.createPartMock(partInterface, misc)
    return instance(mockedPart)
  }

  public static createPartMock(
    partInterface?: Partial<PartInterface>,
    misc?: {
      partTimings?: Partial<PartTimings>
      executedAt?: number
      piecesWithLifespanFilters?: Piece[]
    }
  ): Part {
    const mockedPart: Part = mock(Part)

    if (!partInterface) {
      partInterface = {} as PartInterface
    }

    if (!misc) {
      misc = {}
    }

    when(mockedPart.id).thenReturn(
      partInterface.id ?? (partInterface.rank ? `part${partInterface.rank}` : 'partId')
    )
    when(mockedPart.getSegmentId()).thenReturn(partInterface.segmentId ?? 'segmentId')
    when(mockedPart.rank).thenReturn(partInterface.rank ?? 1)
    when(mockedPart.name).thenReturn(partInterface.name ?? 'partName')
    when(mockedPart.isNext()).thenReturn(partInterface.isNext ?? false)
    when(mockedPart.isOnAir()).thenReturn(partInterface.isOnAir ?? false)
    when(mockedPart.expectedDuration).thenReturn(partInterface.expectedDuration ?? 0)
    when(mockedPart.inTransition).thenReturn(
      partInterface.inTransition ?? { keepPreviousPartAliveDuration: 0, delayPiecesDuration: 0 }
    )
    when(mockedPart.outTransition).thenReturn(partInterface.outTransition ?? { keepAliveDuration: 0 })
    when(mockedPart.autoNext).thenReturn(partInterface.autoNext ?? undefined)
    when(mockedPart.disableNextInTransition).thenReturn(partInterface.disableNextInTransition ?? false)

    when(mockedPart.getExecutedAt()).thenReturn(misc.executedAt ?? 0)
    when(mockedPart.isPlanned).thenReturn(partInterface.isPlanned ?? true)

    when(mockedPart.getPieces()).thenReturn(partInterface.pieces ?? [])
    when(mockedPart.getPiecesWithLifespan(anything())).thenReturn(misc.piecesWithLifespanFilters ?? [])

    when(mockedPart.getTimings()).thenReturn({
      inTransitionStart: misc.partTimings?.inTransitionStart ?? undefined,
      delayStartOfPiecesDuration: misc.partTimings?.delayStartOfPiecesDuration ?? 0,
      postRollDuration: misc.partTimings?.postRollDuration ?? 0,
      previousPartContinueIntoPartDuration: misc.partTimings?.previousPartContinueIntoPartDuration ?? 0,
    })

    when(mockedPart.getEndState()).thenReturn(partInterface.endState)

    return mockedPart
  }

  public static createPiece(pieceInterface?: Partial<PieceInterface>, misc?: { executedAt?: number }): Piece {
    const mockedPiece: Piece = this.createPieceMock(pieceInterface, misc)
    return instance(mockedPiece)
  }

  public static createPieceMock(
    pieceInterface?: Partial<PieceInterface>,
    misc?: { executedAt?: number }
  ): Piece {
    const mockedPiece: Piece = mock(Piece)

    if (!pieceInterface) {
      pieceInterface = {} as PieceInterface
    }

    if (!misc) {
      misc = {}
    }

    when(mockedPiece.id).thenReturn(pieceInterface.id ?? 'pieceId')
    when(mockedPiece.name).thenReturn(pieceInterface.name ?? 'pieceName')
    when(mockedPiece.getPartId()).thenReturn(pieceInterface.partId ?? 'partId')
    when(mockedPiece.outputLayer).thenReturn(pieceInterface.outputLayer ?? Tv2OutputLayer.NONE)
    when(mockedPiece.layer).thenReturn(pieceInterface.layer ?? 'layer')
    when(mockedPiece.isPlanned).thenReturn(pieceInterface.isPlanned ?? true)
    when(mockedPiece.getStart()).thenReturn(pieceInterface.start ?? 0)
    when(mockedPiece.duration).thenReturn(pieceInterface.duration ?? 0)
    when(mockedPiece.pieceLifespan).thenReturn(pieceInterface.pieceLifespan ?? PieceLifespan.WITHIN_PART)
    when(mockedPiece.timelineObjects).thenReturn(pieceInterface.timelineObjects ?? [])
    when(mockedPiece.preRollDuration).thenReturn(pieceInterface.preRollDuration ?? 0)
    when(mockedPiece.postRollDuration).thenReturn(pieceInterface.postRollDuration ?? 0)
    when(mockedPiece.transitionType).thenReturn(pieceInterface.transitionType ?? TransitionType.NO_TRANSITION)
    when(mockedPiece.tags).thenReturn(pieceInterface.tags ?? [])
    when(mockedPiece.content).thenReturn(pieceInterface.content)

    when(mockedPiece.getExecutedAt()).thenReturn(misc.executedAt ?? 0)

    return mockedPiece
  }
}
