import { anyString, anything, instance, mock, when } from '@typestrong/ts-mockito'
import { Tv2ActionService } from './tv2-action-service'
import { Tv2Logger } from './tv2-logger'
import { Tv2ConfigurationMapper } from './helpers/tv2-configuration-mapper'
import { Tv2ActionFactoryProvider } from './action-factories/tv2-action-factory-provider'
import { ConfigurationTestFactory } from '../../model/entities/test/configuration-test-factory'
import { Action } from '../../model/entities/action'
import { Configuration } from '../../model/entities/configuration'
import { Tv2AudioActionFactory } from './action-factories/tv2-audio-action-factory'
import { Tv2CameraActionFactory } from './action-factories/tv2-camera-action-factory'
import { Tv2RemoteActionFactory } from './action-factories/tv2-remote-action-factory'
import { Tv2TransitionEffectActionFactory } from './action-factories/tv2-transition-effect-action-factory'
import { Tv2GraphicsActionFactory } from './action-factories/tv2-graphics-action-factory'
import { Tv2VideoClipActionFactory } from './action-factories/tv2-video-clip-action-factory'
import {
  Tv2VideoMixerConfigurationActionFactory
} from './action-factories/tv2-video-mixer-configuration-action-factory'
import { Tv2SplitScreenActionFactory } from './action-factories/tv2-split-screen-action-factory'
import { Tv2ReplayActionFactory } from './action-factories/tv2-replay-action-factory'
import { Tv2RobotActionFactory } from './action-factories/tv2-robot-action-factory'
import { PartActionType, PieceActionType } from '../../model/enums/action-type'
import { Tv2ActionSubtype } from './value-objects/tv2-action'
import { EntityTestFactory } from '../../model/entities/test/entity-test-factory'
import { PlayoutContentType } from '../../model/enums/playout-content-type'
import { OutputChannel } from '../../model/enums/output-channel'

describe(Tv2ActionService.name, () => {
  describe(Tv2ActionService.prototype.generateActions.name, () => {
    describe('when all action types are created', () => {
      it('returns at least one action of each type', () => {
        const testee: Tv2ActionService = createTestee()
        const configuration: Configuration = ConfigurationTestFactory.createConfiguration()

        const result: Action[] = testee.generateActions(configuration, 'showstyleid', [])

        expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ metadata: expect.objectContaining({ playoutContent: { type: PlayoutContentType.AUDIO } }) })]))
        expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ metadata: expect.objectContaining({ playoutContent: { type: PlayoutContentType.CAMERA, source: '1' } }) })]))
        expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ metadata: expect.objectContaining({ playoutContent: { type: PlayoutContentType.REMOTE, source: '' } }) })]))
        expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ metadata: expect.objectContaining({ playoutContent: { type: PlayoutContentType.TRANSITION } }) })]))
        expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ metadata: expect.objectContaining({ playoutContent: { type: PlayoutContentType.GRAPHICS } }) })]))
        expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ metadata: expect.objectContaining({ playoutContent: { type: PlayoutContentType.VIDEO_CLIP } }) })]))
        expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ metadata: expect.objectContaining({ playoutContent: { type: PlayoutContentType.UNKNOWN } }) })])) // Video mixer action
        expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ metadata: expect.objectContaining({ playoutContent: { type: PlayoutContentType.SPLIT_SCREEN, layout: '', sources: [] } }) })]))
        expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ metadata: expect.objectContaining({ playoutContent: { type: PlayoutContentType.REPLAY } }) })]))
        expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ metadata: expect.objectContaining({ playoutContent: { type: PlayoutContentType.ROBOT } }) })]))
      })
    })

    describe('when one or more action types fail to create', () => {
      describe('when split screen and camera actions fail to be generated', () => {
        it('ignores the failed action types', () => {
          const mockedTv2CameraActionFactory: Tv2CameraActionFactory = mock()
          when(mockedTv2CameraActionFactory.createCameraActions(anything())).thenCall(() => { throw new Error('Some camera action error.') })

          const mockedTv2SplitScreenActionFactory: Tv2SplitScreenActionFactory = mock()
          when(mockedTv2SplitScreenActionFactory.createSplitScreenActions(anything(), anything())).thenCall(() => { throw new Error('Some split screen action error.') })

          const testee: Tv2ActionService = createTestee({
            actionFactoryProvider: instance(createMockOfTv2ActionFactoryProvider({
              cameraActionFactory: instance(mockedTv2CameraActionFactory),
              splitScreenActionFactory: instance(mockedTv2SplitScreenActionFactory),
            })),
          })
          const configuration: Configuration = ConfigurationTestFactory.createConfiguration()

          const result: Action[] = testee.generateActions(configuration, 'showstyleid', [])

          expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ metadata: expect.objectContaining({ playoutContent: { type: PlayoutContentType.AUDIO } }) })]))
          expect(result).toEqual(expect.not.arrayContaining([expect.objectContaining({ metadata: expect.objectContaining({ playoutContent: { type: PlayoutContentType.CAMERA, source: '1' } }) })]))
          expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ metadata: expect.objectContaining({ playoutContent: { type: PlayoutContentType.REMOTE, source: '' } }) })]))
          expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ metadata: expect.objectContaining({ playoutContent: { type: PlayoutContentType.TRANSITION } }) })]))
          expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ metadata: expect.objectContaining({ playoutContent: { type: PlayoutContentType.GRAPHICS } }) })]))
          expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ metadata: expect.objectContaining({ playoutContent: { type: PlayoutContentType.VIDEO_CLIP } }) })]))
          expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ metadata: expect.objectContaining({ playoutContent: { type: PlayoutContentType.UNKNOWN } }) })])) // Video mixer action
          expect(result).toEqual(expect.not.arrayContaining([expect.objectContaining({ metadata: expect.objectContaining({ playoutContent: { type: PlayoutContentType.SPLIT_SCREEN } }) })]))
          expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ metadata: expect.objectContaining({ playoutContent: { type: PlayoutContentType.REPLAY } }) })]))
          expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ metadata: expect.objectContaining({ playoutContent: { type: PlayoutContentType.ROBOT } }) })]))
        })
      })

      describe('when graphics and remote actions fail to be generated', () => {
        it('ignores the failed action types', () => {
          const mockedTv2RemoteActionFactory: Tv2RemoteActionFactory = mock()
          when(mockedTv2RemoteActionFactory.createRemoteActions(anything())).thenCall(() => { throw new Error('Some remote action error.') })

          const mockedTv2GraphicsActionFactory: Tv2GraphicsActionFactory = mock()
          when(mockedTv2GraphicsActionFactory.createGraphicsActions(anything(), anything())).thenCall(() => { throw new Error('Some graphics action error.') })

          const testee: Tv2ActionService = createTestee({
            actionFactoryProvider: instance(createMockOfTv2ActionFactoryProvider({
              remoteActionFactory: instance(mockedTv2RemoteActionFactory),
              graphicsActionFactory: instance(mockedTv2GraphicsActionFactory),
            })),
          })
          const configuration: Configuration = ConfigurationTestFactory.createConfiguration()

          const result: Action[] = testee.generateActions(configuration, 'showstyleid', [])

          expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ metadata: expect.objectContaining({ playoutContent: { type: PlayoutContentType.AUDIO } }) })]))
          expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ metadata: expect.objectContaining({ playoutContent: { type: PlayoutContentType.CAMERA, source: '1' } }) })]))
          expect(result).toEqual(expect.not.arrayContaining([expect.objectContaining({ metadata: expect.objectContaining({ playoutContent: { type: PlayoutContentType.REMOTE } }) })]))
          expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ metadata: expect.objectContaining({ playoutContent: { type: PlayoutContentType.TRANSITION } }) })]))
          expect(result).toEqual(expect.not.arrayContaining([expect.objectContaining({ metadata: expect.objectContaining({ playoutContent: { type: PlayoutContentType.GRAPHICS } }) })]))
          expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ metadata: expect.objectContaining({ playoutContent: { type: PlayoutContentType.VIDEO_CLIP } }) })]))
          expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ metadata: expect.objectContaining({ playoutContent: { type: PlayoutContentType.UNKNOWN } }) })])) // Video mixer action
          expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ metadata: expect.objectContaining({ playoutContent: { type: PlayoutContentType.SPLIT_SCREEN, layout: '', sources: [] } }) })]))
          expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ metadata: expect.objectContaining({ playoutContent: { type: PlayoutContentType.REPLAY } }) })]))
          expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ metadata: expect.objectContaining({ playoutContent: { type: PlayoutContentType.ROBOT } }) })]))
        })
      })
    })
  })
})

function createTestee(mocks: { configurationMapper?: Tv2ConfigurationMapper, actionFactoryProvider?: Tv2ActionFactoryProvider, logger?: Tv2Logger } = {}): Tv2ActionService {
  return new Tv2ActionService(
    mocks.configurationMapper ?? instance(mock<Tv2ConfigurationMapper>()),
    mocks.actionFactoryProvider ?? instance(createMockOfTv2ActionFactoryProvider()),
    mocks.logger ?? instance(createMockOfTv2Logger()),
  )
}

function createMockOfTv2Logger(): Tv2Logger {
  const mockedLogger: Tv2Logger = mock<Tv2Logger>()
  when(mockedLogger.tag(anyString())).thenCall(() => instance(mockedLogger))
  when(mockedLogger.data(anything())).thenCall(() => instance(mockedLogger))
  when(mockedLogger.metadata(anything())).thenCall(() => instance(mockedLogger))
  return mockedLogger
}


function createMockOfTv2ActionFactoryProvider(
  mocks: {
    audioActionFactory?: Tv2AudioActionFactory,
    cameraActionFactory?: Tv2CameraActionFactory,
    remoteActionFactory?: Tv2RemoteActionFactory,
    transitionEffectActionFactory?: Tv2TransitionEffectActionFactory,
    graphicsActionFactory?: Tv2GraphicsActionFactory,
    videoClipActionFactory?: Tv2VideoClipActionFactory,
    videoMixerActionFactory?: Tv2VideoMixerConfigurationActionFactory,
    splitScreenActionFactory?: Tv2SplitScreenActionFactory,
    replayActionFactory?: Tv2ReplayActionFactory,
    robotActionFactory?: Tv2RobotActionFactory,
  } = {}
): Tv2ActionFactoryProvider {
  const mockedActionFactoryProvider: Tv2ActionFactoryProvider = mock<Tv2ActionFactoryProvider>()
  when(mockedActionFactoryProvider.createAudioActionFactory(anything())).thenReturn(mocks.audioActionFactory ?? instance(createMockOfTv2AudioActionFactory()))
  when(mockedActionFactoryProvider.createCameraActionFactory(anything())).thenReturn(mocks.cameraActionFactory ?? instance(createMockOfTv2CameraActionFactory()))
  when(mockedActionFactoryProvider.createRemoteActionFactory(anything())).thenReturn(mocks.remoteActionFactory ?? instance(createMockOfTv2RemoteActionFactory()))
  when(mockedActionFactoryProvider.createTransitionEffectActionFactory(anything())).thenReturn(mocks.transitionEffectActionFactory ?? instance(createMockOfTv2TransitionEffectActionFactory()))
  when(mockedActionFactoryProvider.createGraphicsActionFactory(anything())).thenReturn(mocks.graphicsActionFactory ?? instance(createMockOfTv2GraphicsActionFactory()))
  when(mockedActionFactoryProvider.createVideoClipActionFactory(anything())).thenReturn(mocks.videoClipActionFactory ?? instance(createMockOfTv2VideoClipActionFactory()))
  when(mockedActionFactoryProvider.createVideoMixerActionFactory(anything())).thenReturn(mocks.videoMixerActionFactory?? instance(createMockOfTv2VideoMixerConfigurationActionFactory()))
  when(mockedActionFactoryProvider.createSplitScreenActionFactory(anything())).thenReturn(mocks.splitScreenActionFactory?? instance(createMockOfTv2SplitScreenActionFactory()))
  when(mockedActionFactoryProvider.createReplayActionFactory(anything())).thenReturn(mocks.replayActionFactory?? instance(createMockOfTv2ReplayActionFactory()))
  when(mockedActionFactoryProvider.createRobotActionFactory(anything())).thenReturn(mocks.robotActionFactory?? instance(createMockOfTv2RobotActionFactory()))
  return mockedActionFactoryProvider
}

function createMockOfTv2AudioActionFactory(): Tv2AudioActionFactory {
  const mockedAudioActionFactory: Tv2AudioActionFactory = mock<Tv2AudioActionFactory>()
  when(mockedAudioActionFactory.createAudioActions(anything(), anything())).thenReturn([
    {
      id: 'audio_action_id',
      name: 'Audio action',
      type: PieceActionType.INSERT_PIECE_AS_ON_AIR,
      rank: 0,
      data: {
        pieceInterface: EntityTestFactory.createPieceInterface(),
      },
      metadata: {
        playoutContent: {
          type: PlayoutContentType.AUDIO
        },
        outputChannel: OutputChannel.PROGRAM
      }
    }
  ])
  return mockedAudioActionFactory
}

function createMockOfTv2CameraActionFactory(): Tv2CameraActionFactory {
  const mockedCameraActionFactory: Tv2CameraActionFactory = mock<Tv2CameraActionFactory>()
  when(mockedCameraActionFactory.createCameraActions(anything())).thenReturn([
    {
      id: 'camera_action_id',
      name: 'Camera action',
      type: PartActionType.INSERT_PART_AS_NEXT,
      rank: 0,
      data: {
        partInterface: EntityTestFactory.createPartInterface(),
        pieceInterfaces: [],
      },
      metadata: {
        playoutContent: {
          type: PlayoutContentType.CAMERA,
          source: '1'
        },
        outputChannel: OutputChannel.PREVIEW
      }
    }
  ])
  return mockedCameraActionFactory
}

function createMockOfTv2RemoteActionFactory(): Tv2RemoteActionFactory {
  const mockedRemoteActionFactory: Tv2RemoteActionFactory = mock<Tv2RemoteActionFactory>()
  when(mockedRemoteActionFactory.createRemoteActions(anything())).thenReturn([
    {
      id: 'remote_action_id',
      name: 'Remote action',
      type: PartActionType.INSERT_PART_AS_NEXT,
      rank: 0,
      data: {
        partInterface: EntityTestFactory.createPartInterface(),
        pieceInterfaces: [],
      },
      metadata: {
        playoutContent: {
          type: PlayoutContentType.REMOTE,
          source: ''
        },
        outputChannel: OutputChannel.PREVIEW
      }
    }
  ])
  return mockedRemoteActionFactory
}

function createMockOfTv2TransitionEffectActionFactory(): Tv2TransitionEffectActionFactory {
  const mockedTransitionEffectActionFactory: Tv2TransitionEffectActionFactory = mock<Tv2TransitionEffectActionFactory>()
  when(mockedTransitionEffectActionFactory.createTransitionEffectActions(anything())).thenReturn([
    {
      id: 'transition_effect_action_id',
      name: 'Transition effect action',
      type: PieceActionType.INSERT_PIECE_AS_NEXT,
      rank: 0,
      data: {
        pieceInterface: EntityTestFactory.createPieceInterface(),
      },
      metadata: {
        playoutContent: {
          type: PlayoutContentType.TRANSITION
        }
      }
    }
  ])
  return mockedTransitionEffectActionFactory
}

function createMockOfTv2GraphicsActionFactory(): Tv2GraphicsActionFactory {
  const mockedGraphicsActionFactory: Tv2GraphicsActionFactory = mock<Tv2GraphicsActionFactory>()
  when(mockedGraphicsActionFactory.createGraphicsActions(anything(), anything())).thenReturn([
    {
      id: 'graphics_action_id',
      name: 'Graphics action',
      type: PartActionType.INSERT_PART_AS_NEXT,
      rank: 0,
      data: {
        partInterface: EntityTestFactory.createPartInterface(),
        pieceInterfaces: [],
      },
      metadata: {
        playoutContent: {
          type: PlayoutContentType.GRAPHICS
        },
        outputChannel: OutputChannel.PREVIEW
      }
    }
  ])
  return mockedGraphicsActionFactory
}

function createMockOfTv2VideoClipActionFactory(): Tv2VideoClipActionFactory {
  const mockedVideoClipActionFactory: Tv2VideoClipActionFactory = mock<Tv2VideoClipActionFactory>()
  when(mockedVideoClipActionFactory.createVideoClipActions(anything(), anything())).thenReturn([
    {
      id: 'video_clip_action_id',
      name: 'Video clip action',
      type: PartActionType.INSERT_PART_AS_NEXT,
      rank: 0,
      data: {
        partInterface: EntityTestFactory.createPartInterface(),
        pieceInterfaces: [],
      },
      metadata: {
        playoutContent: {
          type: PlayoutContentType.VIDEO_CLIP
        },
        outputChannel: OutputChannel.PREVIEW,
        fileName: 'some-file-name',
        configuredVideoClipPostRollDuration: 0,
      }
    }
  ])
  return mockedVideoClipActionFactory
}

function createMockOfTv2VideoMixerConfigurationActionFactory(): Tv2VideoMixerConfigurationActionFactory {
  const mockedVideoMixerActionFactory: Tv2VideoMixerConfigurationActionFactory = mock<Tv2VideoMixerConfigurationActionFactory>()
  when(mockedVideoMixerActionFactory.createVideoMixerActions(anything())).thenReturn([
    {
      id: 'video_mixer_action_id',
      name: 'Video mixer action',
      type: PartActionType.INSERT_PART_AS_NEXT,
      rank: 0,
      data: {
        partInterface: EntityTestFactory.createPartInterface(),
        pieceInterfaces: [],
      },
      metadata: {
        playoutContent: {
          type: PlayoutContentType.UNKNOWN
        },
        outputChannel: OutputChannel.PREVIEW
      }
    }
  ])
  return mockedVideoMixerActionFactory
}

function createMockOfTv2SplitScreenActionFactory(): Tv2SplitScreenActionFactory {
  const mockedSplitScreenActionFactory: Tv2SplitScreenActionFactory = mock<Tv2SplitScreenActionFactory>()
  when(mockedSplitScreenActionFactory.createSplitScreenActions(anything(), anything())).thenReturn([
    {
      id: 'split_screen_action_id',
      name: 'Split screen action',
      type: PieceActionType.INSERT_PIECE_AS_NEXT,
      rank: 0,
      data: {
        pieceInterface: EntityTestFactory.createPieceInterface(),
      },
      metadata: {
        playoutContent: {
          type: PlayoutContentType.SPLIT_SCREEN,
          layout: '',
          sources: []
        },
        actionSubtype: Tv2ActionSubtype.SPLIT_SCREEN_INSERT_SOURCE_TO_INPUT,
      }
    }
  ])
  return mockedSplitScreenActionFactory
}

function createMockOfTv2ReplayActionFactory(): Tv2ReplayActionFactory {
  const mockedReplayActionFactory: Tv2ReplayActionFactory = mock<Tv2ReplayActionFactory>()
  when(mockedReplayActionFactory.createReplayActions(anything())).thenReturn([
    {
      id: 'replay_action_id',
      name: 'Replay action',
      type: PartActionType.INSERT_PART_AS_NEXT,
      rank: 0,
      data: {},
      metadata: {
        playoutContent: {
          type: PlayoutContentType.REPLAY
        }
      }
    }
  ])
  return mockedReplayActionFactory
}

function createMockOfTv2RobotActionFactory(): Tv2RobotActionFactory {
  const mockedRobotActionFactory: Tv2RobotActionFactory = mock<Tv2RobotActionFactory>()
  when(mockedRobotActionFactory.createRobotActions()).thenReturn([
    {
      id: 'robot_action_id',
      name: 'Robot action',
      type: PieceActionType.INSERT_PIECE_AS_NEXT,
      rank: 0,
      data: {
        pieceInterface: EntityTestFactory.createPieceInterface(),
      },
      metadata: {
        playoutContent: {
          type: PlayoutContentType.ROBOT
        }
      }
    }
  ])
  return mockedRobotActionFactory
}
