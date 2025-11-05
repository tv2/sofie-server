import { Tv2TransitionEffectActionFactory } from './tv2-transition-effect-action-factory'
import {
  Tv2VideoMixerTimelineObjectFactory
} from '../../interfaces/timeline-object-factories/tv2-video-mixer-timeline-object-factory'
import { Tv2CasparcgTimelineObjectFactory } from '../timeline-object-factories/tv2-casparcg-timeline-object-factory'
import {
  Tv2AudioMixerTimelineObjectFactory
} from '../../interfaces/timeline-object-factories/tv2-audio-mixer-timeline-object-factory'
import { anything, instance, mock, when } from '@typestrong/ts-mockito'
import { Tv2AssetPathHelper } from '../tv2-asset-path-helper'
import { FrameTimeConverter } from '../frame-time-converter'
import { EntityTestFactory } from '../../../../rundown-execution/domain/entities/test/entity-test-factory'
import {
  Tv2Action,
  Tv2BreakerTransitionEffectActionMetadata,
  Tv2MixTransitionEffectActionMetadata,
  Tv2TransitionEffectAction,
  Tv2TransitionEffectActionMetadata
} from '../../value-objects/tv2-action'
import {
  Action,
  MutateActionMethods,
  MutateActionType,
  MutateActionWithArgumentsMethods,
  MutateActionWithPieceMethods
} from '../../../../action-system/domain/entities/action'
import { Breaker, TransitionEffectType } from '../../value-objects/tv2-show-style-blueprint-configuration'
import { Tv2DownstreamKeyer } from '../../value-objects/tv2-studio-blueprint-configuration'
import { PlayoutContentType } from '../../../../rundown-execution/domain/enums/playout-content-type'
import { OutputChannel } from '../../../../rundown-execution/domain/enums/output-channel'
import { PieceActionType } from '../../../../action-system/domain/enums/action-type'
import { Logger } from '../../../../cross-cutting-concerns/application/interfaces/logger'
import {
  Tv2AtemVideoMixerTimelineObjectFactory
} from '../timeline-object-factories/tv2-atem-video-mixer-timeline-object-factory'
import { Tv2AtemLayer } from '../../value-objects/tv2-layers'
import { DeviceType } from '../../../../sofie-ingest/domain/enums/device-type'
import {
  AtemMixEffectType,
  AtemMixEffectWithTransition,
  AtemType
} from '../../value-objects/timeline-state-resolver-types/atem-types'
import { TimelineObject } from '../../../../rundown-execution/domain/entities/timeline-object'

describe(Tv2TransitionEffectActionFactory.name, () => {
  describe(Tv2TransitionEffectActionFactory.prototype.getMutateActionMethods.name, () => {
    describe('it mutates a BreakerTransitionAction', () => {
      it('has a blockTakeDuration of 4200 ms when breaker duration is 100 frames and casparCg pre roll duration is 200 ms', () => {
        const breakerActionMetadata: Tv2BreakerTransitionEffectActionMetadata = createBreakerActionMetadata(100, 200)
        testBlockTakeDurationForBreakerAction(breakerActionMetadata, 4200)
      })

      it('has a blockTakeDuration of 4100 ms when breaker duration is 100 frames and casparCg pre roll duration is 100 ms', () => {
        const breakerActionMetadata: Tv2BreakerTransitionEffectActionMetadata = createBreakerActionMetadata(100, 100)
        testBlockTakeDurationForBreakerAction(breakerActionMetadata, 4100)
      })

      it('has a blockTakeDuration of 2200 ms when breaker duration is 50 frames and casparCg pre roll duration is 200 ms', () => {
        const breakerActionMetadata: Tv2BreakerTransitionEffectActionMetadata = createBreakerActionMetadata(50, 200)
        testBlockTakeDurationForBreakerAction(breakerActionMetadata, 2200)
      })

      it('has a blockTakeDuration of 2100 ms when breaker duration is 50 frames and casparCg pre roll duration is 100 ms', () => {
        const breakerActionMetadata: Tv2BreakerTransitionEffectActionMetadata = createBreakerActionMetadata(50, 100)
        testBlockTakeDurationForBreakerAction(breakerActionMetadata, 2100)
      })
    })

    describe('it mutates a MixTransitionEffectAction', () => {
      it('has a duration of 50 frames when set to 50 frames ', () => {
        const mutatedAction: Action = getMutatedMixTransitionEffectAction(50)
        const result: Tv2MixTransitionEffectActionMetadata = mutatedAction.metadata as Tv2MixTransitionEffectActionMetadata

        expect(result.durationInFrames).toBe(50)
      })

      it('has a duration of 250 frames when set to 250 frames ', () => {
        const mutatedAction: Action = getMutatedMixTransitionEffectAction(250)
        const result: Tv2MixTransitionEffectActionMetadata = mutatedAction.metadata as Tv2MixTransitionEffectActionMetadata

        expect(result.durationInFrames).toBe(250)
      })

      it('has a duration of 250 frames when set to 400 frames ', () => {
        const mutatedAction: Action = getMutatedMixTransitionEffectAction(400)
        const result: Tv2MixTransitionEffectActionMetadata = mutatedAction.metadata as Tv2MixTransitionEffectActionMetadata

        expect(result.durationInFrames).toBe(250)
      })

      describe('it creates downStreamKeyerTimelineObjects that starts after the CasparCgPreRollDuration', () => {
        it('has a CasparCgPreRollDuration of 100, the enable.start = 100', () => {
          testDskEnableStartIsEqualToCasparcgPreRollDuration(100)
        })

        it('has a CasparCgPreRollDuration of 250, the enable.start = 250', () => {
          testDskEnableStartIsEqualToCasparcgPreRollDuration(250)
        })

        it('has a CasparCgPreRollDuration of 500, the enable.start = 500', () => {
          testDskEnableStartIsEqualToCasparcgPreRollDuration(500)
        })
      })
    })
  })
})

function createBreakerActionMetadata(durationInFrames: number, casparcgPreRollDurationInMs: number): Tv2BreakerTransitionEffectActionMetadata {
  return {
    breaker: {
      durationInFrames
    } as Breaker,
    casparcgPreRollDuration: casparcgPreRollDurationInMs,
    breakerFolder: '',
    playoutContent: {
      type: PlayoutContentType.TRANSITION
    },
    outputChannel: OutputChannel.UNKNOWN,
    transitionEffectType: TransitionEffectType.BREAKER,
    downstreamKeyer: {} as Tv2DownstreamKeyer
  }
}

function createTransitionActionMetadata(durationInFrames: number): Tv2TransitionEffectActionMetadata {
  return {
    transitionEffectType: TransitionEffectType.MIX,
    durationInFrames: durationInFrames,
    playoutContent: {
      type: PlayoutContentType.TRANSITION
    },
    outputChannel: OutputChannel.UNKNOWN
  }
}

function testBlockTakeDurationForBreakerAction(breakerActionMetadata: Tv2BreakerTransitionEffectActionMetadata, expectedBlockTakeDuration: number): void {
  const randomSourceInput: number = 1
  const videoMixerTimelineObjectFactory: Tv2VideoMixerTimelineObjectFactory = mock<Tv2VideoMixerTimelineObjectFactory>()
  when(videoMixerTimelineObjectFactory.findProgramSourceInputFromPiece(anything())).thenReturn(randomSourceInput)

  const action: Tv2TransitionEffectAction = EntityTestFactory.createPieceAction({
    metadata: breakerActionMetadata,
  }) as Tv2TransitionEffectAction

  const frameRate: number = 25
  const testee: Tv2TransitionEffectActionFactory = createTestee({ videoMixerTimelineObjectFactory, frameTimeConverter: new FrameTimeConverter(frameRate) })
  const pieceMutateActionMethods: MutateActionWithPieceMethods = getMutateActionWithMethods(testee, action, MutateActionType.PIECE) as MutateActionWithPieceMethods
  const result: Tv2TransitionEffectAction = pieceMutateActionMethods.updateActionWithPiece(action, EntityTestFactory.createPiece()) as Tv2TransitionEffectAction

  expect(result.data.partInTransition?.blockTakeDuration).toBe(expectedBlockTakeDuration)
}

function getMutatedMixTransitionEffectAction(durationInFrames: number): Action {
  const mixTransitionEffectMetadata: Tv2TransitionEffectActionMetadata = createTransitionActionMetadata(0)
  const action: Tv2TransitionEffectAction = EntityTestFactory.createPieceAction({ type: PieceActionType.INSERT_PIECE_AS_NEXT, metadata: mixTransitionEffectMetadata,
  }) as Tv2TransitionEffectAction
  const videoMixerTimelineObjectFactory: Tv2VideoMixerTimelineObjectFactory = mock<Tv2VideoMixerTimelineObjectFactory>()
  const frameRate: number = 25
  const testee: Tv2TransitionEffectActionFactory = createTestee({ videoMixerTimelineObjectFactory, frameTimeConverter: new FrameTimeConverter(frameRate) })
  const mutatedActionWithMethods: MutateActionWithArgumentsMethods = getMutateActionWithMethods(testee, action, MutateActionType.APPLY_ARGUMENTS) as MutateActionWithArgumentsMethods
  return mutatedActionWithMethods.updateActionWithArguments(action, durationInFrames)
}

function getMutateActionWithMethods(transitionEffectActionFactory: Tv2TransitionEffectActionFactory, action: Tv2Action, mutateActionType: MutateActionType): MutateActionMethods {
  const mutateActionMethods: MutateActionMethods[] = transitionEffectActionFactory.getMutateActionMethods(action)
  const mutateActionWithMethods: MutateActionMethods | undefined = mutateActionMethods.find(m => m.type === mutateActionType) as MutateActionMethods | undefined
  if (!mutateActionWithMethods) {
    throw new Error('No MutateActionMethodsFound')
  }
  return mutateActionWithMethods
}

// Note: This is an integration test between Tv2TransitionEffectActionFactory and Tv2AtemVideoMixerTimelineObjectFactory.
function testDskEnableStartIsEqualToCasparcgPreRollDuration(casparcgPreRollDuration: number): void {
  const action: Tv2TransitionEffectAction = EntityTestFactory.createPieceAction({
    metadata: createBreakerActionMetadata(10, casparcgPreRollDuration),
  }) as Tv2TransitionEffectAction

  const videoMixerTimelineObjectFactory: Tv2VideoMixerTimelineObjectFactory = new Tv2AtemVideoMixerTimelineObjectFactory(instance(mock<Logger>()))
  const testee: Tv2TransitionEffectActionFactory = createTestee({ videoMixerTimelineObjectFactory })

  const mutateActionMethods: MutateActionWithPieceMethods = getMutateActionWithMethods(testee, action, MutateActionType.PIECE) as MutateActionWithPieceMethods
  const timelineObject: TimelineObject = EntityTestFactory.createTimelineObject({
    layer: Tv2AtemLayer.PROGRAM,
    content: {
      deviceType: DeviceType.ATEM,
      type: AtemType.ME,
      me: {
        type: AtemMixEffectType.TRANSITION,
        input: 1
      } as AtemMixEffectWithTransition
    },
  })
  const mutatedAction: Tv2TransitionEffectAction = mutateActionMethods.updateActionWithPiece(action, EntityTestFactory.createPiece({ timelineObjects: [timelineObject] })) as Tv2TransitionEffectAction
  const dskTimelineObject: TimelineObject | undefined = mutatedAction.data.pieceInterface.timelineObjects.find(timelineObject => timelineObject.content.type === AtemType.DSK)

  if (!dskTimelineObject) {
    throw new Error('No DSK TimelineObject created')
  }

  expect(dskTimelineObject.enable.start).toBe(casparcgPreRollDuration)
}

function createTestee(params?: {
  videoMixerTimelineObjectFactory?: Tv2VideoMixerTimelineObjectFactory
  casparcgTimelineObjectFactory?: Tv2CasparcgTimelineObjectFactory
  audioMixerTimelineObjectFactory?: Tv2AudioMixerTimelineObjectFactory
  assetPathHelper?: Tv2AssetPathHelper
  frameTimeConverter?: FrameTimeConverter
  logger?: Logger
}): Tv2TransitionEffectActionFactory {
  return new Tv2TransitionEffectActionFactory(
    params?.videoMixerTimelineObjectFactory ?? instance(mock<Tv2VideoMixerTimelineObjectFactory>()),
    params?.casparcgTimelineObjectFactory ?? instance(mock(Tv2CasparcgTimelineObjectFactory)),
    params?.audioMixerTimelineObjectFactory ?? instance(mock<Tv2AudioMixerTimelineObjectFactory>()),
    params?.assetPathHelper ?? instance(mock(Tv2AssetPathHelper)),
    params?.frameTimeConverter ?? instance(mock(FrameTimeConverter)),
    params?.logger ?? instance(mock<Logger>()))
}
