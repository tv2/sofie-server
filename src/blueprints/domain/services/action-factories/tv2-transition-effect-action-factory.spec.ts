import {Tv2TransitionEffectActionFactory} from './tv2-transition-effect-action-factory'
import {
  Tv2VideoMixerTimelineObjectFactory
} from '../../interfaces/timeline-object-factories/tv2-video-mixer-timeline-object-factory'
import {Tv2CasparCgTimelineObjectFactory} from '../timeline-object-factories/tv2-caspar-cg-timeline-object-factory'
import {
  Tv2AudioMixerTimelineObjectFactory
} from '../../interfaces/timeline-object-factories/tv2-audio-mixer-timeline-object-factory'
import {anything, instance, mock, when} from '@typestrong/ts-mockito'
import {Tv2AssetPathHelper} from '../tv2-asset-path-helper'
import {Tv2Logger} from '../../interfaces/tv2-logger'
import {FrameTimeConverter} from '../frame-time-converter'
import {EntityTestFactory} from '../../../../rundown-execution/domain/entities/test/entity-test-factory'
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
import {Breaker, TransitionEffectType} from '../../value-objects/tv2-show-style-blueprint-configuration'
import {Tv2DownstreamKeyer} from '../../value-objects/tv2-studio-blueprint-configuration'
import {PlayoutContentType} from '../../../../rundown-execution/domain/enums/playout-content-type'
import {OutputChannel} from '../../../../rundown-execution/domain/enums/output-channel'
import {PieceActionType} from '../../../../model/enums/action-type'

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
