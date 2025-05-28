import { Tv2TransitionEffectActionFactory } from '../tv2-transition-effect-action-factory'
import {
  Tv2VideoMixerTimelineObjectFactory
} from '../../timeline-object-factories/interfaces/tv2-video-mixer-timeline-object-factory'
import { Tv2CasparCgTimelineObjectFactory } from '../../timeline-object-factories/tv2-caspar-cg-timeline-object-factory'
import {
  Tv2AudioMixerTimelineObjectFactory
} from '../../timeline-object-factories/interfaces/tv2-audio-mixer-timeline-object-factory'
import { anything, instance, mock, when } from '@typestrong/ts-mockito'
import { Tv2AssetPathHelper } from '../../helpers/tv2-asset-path-helper'
import { Tv2Logger } from '../../tv2-logger'
import { FrameTimeConverter } from '../../helpers/frame-time-converter'
import { EntityTestFactory } from '../../../../model/entities/test/entity-test-factory'
import {
  Tv2Action,
  Tv2BreakerTransitionEffectActionMetadata,
  Tv2TransitionEffectAction,
  Tv2TransitionEffectActionMetadata
} from '../../value-objects/tv2-action'
import { MutateActionMethods, MutateActionType, MutateActionWithArgumentsMethods, MutateActionWithPieceMethods } from '../../../../model/entities/action'
import { Breaker, TransitionEffectType } from '../../value-objects/tv2-show-style-blueprint-configuration'
import { Tv2DownstreamKeyer } from '../../value-objects/tv2-studio-blueprint-configuration'
import { PlayoutContentType } from '../../../../model/enums/playout-content-type'
import { OutputChannel } from '../../../../model/enums/output-channel'

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
      describe('with a duration of 400 frames to be 250 frames', () => {
        it('should have a blockTakeDuration of 10000 ms, since the max is 250 frames', () => {
          const mixTransitionEffect: Tv2TransitionEffectActionMetadata = createTransitionActionMetadata(400)
          testBlockTakeDurationForMixAction(mixTransitionEffect, 10000)
        })
      })
    })
  })
})

function createBreakerActionMetadata(durationInFrames: number, casparCgPreRollDurationInMs: number): Tv2BreakerTransitionEffectActionMetadata {
  return  {
    breaker: {
      durationInFrames
    } as Breaker,
    casparCgPreRollDuration: casparCgPreRollDurationInMs,
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
  const pieceMutateActionMethods: MutateActionWithPieceMethods = getPieceMutateActionMethods(testee, action)
  const result: Tv2TransitionEffectAction = pieceMutateActionMethods.updateActionWithPiece(action, EntityTestFactory.createPiece()) as Tv2TransitionEffectAction

  expect(result.data.partInTransition?.blockTakeDuration).toBe(expectedBlockTakeDuration)
}

function testBlockTakeDurationForMixAction(mixActionMetadata: Tv2TransitionEffectActionMetadata, expectedBlockTakeDuration: number): void {
  const randomSourceInput: number = 1
  const videoMixerTimelineObjectFactory: Tv2VideoMixerTimelineObjectFactory = mock<Tv2VideoMixerTimelineObjectFactory>()
  when(videoMixerTimelineObjectFactory.findProgramSourceInputFromPiece(anything())).thenReturn(randomSourceInput)

  const action: Tv2TransitionEffectAction = EntityTestFactory.createPieceAction({ metadata: mixActionMetadata,
  }) as Tv2TransitionEffectAction

  const frameRate: number = 25
  const testee: Tv2TransitionEffectActionFactory = createTestee({ videoMixerTimelineObjectFactory, frameTimeConverter: new FrameTimeConverter(frameRate) })
  const mutatedActionWithMethods: MutateActionWithArgumentsMethods = getMutateActionWithArgumentMethods(testee, action)
  const result: Tv2TransitionEffectAction = mutatedActionWithMethods.updateActionWithArguments(action, 400) as Tv2TransitionEffectAction

  expect(result.data.partInTransition?.blockTakeDuration).toBe(expectedBlockTakeDuration)
}

function getPieceMutateActionMethods(transitionEffectActionFactory: Tv2TransitionEffectActionFactory, action: Tv2Action): MutateActionWithPieceMethods {
  const mutateActionMethods: MutateActionMethods[] = transitionEffectActionFactory.getMutateActionMethods(action)
  const pieceMutateActionMethods: MutateActionWithPieceMethods | undefined = mutateActionMethods.find(m => m.type === MutateActionType.PIECE) as MutateActionWithPieceMethods | undefined
  if (!pieceMutateActionMethods) {
    throw new Error('No PieceMutateActionsFound')
  }
  return pieceMutateActionMethods
}

function getMutateActionWithArgumentMethods(transitionEffectActionFactory: Tv2TransitionEffectActionFactory, action: Tv2Action): MutateActionWithArgumentsMethods {
  const mutateActionMethods: MutateActionMethods[] = transitionEffectActionFactory.getMutateActionMethods(action)
  const mutateActionWithMethods: MutateActionWithArgumentsMethods | undefined = mutateActionMethods.find(m => m.type === MutateActionType.APPLY_ARGUMENTS) as MutateActionWithArgumentsMethods | undefined
  if (!mutateActionWithMethods) {
    throw new Error('No MutateActionWithArgumentsMethodsFound')
  }
  return mutateActionWithMethods
}

function createTestee(params?: {
  videoMixerTimelineObjectFactory?: Tv2VideoMixerTimelineObjectFactory,
  casparCgTimelineObjectFactory?: Tv2CasparCgTimelineObjectFactory,
  audioMixerTimelineObjectFactory?: Tv2AudioMixerTimelineObjectFactory,
  assetPathHelper?: Tv2AssetPathHelper,
  frameTimeConverter?: FrameTimeConverter,
  logger?: Tv2Logger
}): Tv2TransitionEffectActionFactory {
  return new Tv2TransitionEffectActionFactory(
    params?.videoMixerTimelineObjectFactory ?? instance(mock<Tv2VideoMixerTimelineObjectFactory>()),
    params?.casparCgTimelineObjectFactory ?? instance(mock(Tv2CasparCgTimelineObjectFactory)),
    params?.audioMixerTimelineObjectFactory ?? instance(mock<Tv2AudioMixerTimelineObjectFactory>()),
    params?.assetPathHelper ?? instance(mock(Tv2AssetPathHelper)),
    params?.frameTimeConverter ?? instance(mock(FrameTimeConverter)),
    params?.logger ?? instance(mock<Tv2Logger>()))
}
