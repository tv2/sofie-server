import { Tv2VideoClipActionFactory } from './tv2-video-clip-action-factory'
import {
  Tv2VideoMixerTimelineObjectFactory
} from '../../interfaces/timeline-object-factories/tv2-video-mixer-timeline-object-factory'
import {
  Tv2AudioMixerTimelineObjectFactory
} from '../../interfaces/timeline-object-factories/tv2-audio-mixer-timeline-object-factory'
import { Tv2CasparCgTimelineObjectFactory } from '../timeline-object-factories/tv2-caspar-cg-timeline-object-factory'
import { anyString, anything, instance, mock, when } from '@typestrong/ts-mockito'
import { Tv2ActionManifestMapper } from '../tv2-action-manifest-mapper'
import { Tv2VideoClipAction } from '../../value-objects/tv2-action'
import { Tv2BlueprintConfigurationTestFactory } from '../tv2-blueprint-configuration-test-factory'
import { Tv2ActionManifest } from '../../value-objects/tv2-action-manifest'
import { Tv2ActionManifestVideoClipData } from '../../value-objects/tv2-action-manifest-data'
import { EntityTestFactory } from '../../../../rundown-execution/domain/entities/test/entity-test-factory'
import {
  Tv2VideoClipTimelineObjectFactory
} from '../../interfaces/timeline-object-factories/tv2-video-clip-timeline-object-factory'
import {Logger} from '../../../../cross-cutting-concerns/application/interfaces/logger'

describe(Tv2VideoClipActionFactory.name, () => {
  describe(Tv2VideoClipActionFactory.prototype.createVideoClipActions.name, () => {
    describe('when multiple equivalent video clip manifests are given', () => {
      it('returns one action for the action manifest with the lowest rank', () => {
        const testee: Tv2VideoClipActionFactory = createTestee()

        const actionManifests: Tv2ActionManifest<Tv2ActionManifestVideoClipData>[] = [
          EntityTestFactory.createActionManifest({
            actionId: 'select_server_clip',
            data: {
              rank: 5,
              userData: {
                adLibPix: true,
                voLevels: false,
                duration: 10000,
                partDefinition: {
                  storyName: 'Some video segment',
                  fields: {
                    videoId: 'my/video/id',
                  }
                }
              }
            }
          }),
          EntityTestFactory.createActionManifest({
            actionId: 'select_server_clip',
            data: {
              rank: 10,
              userData: {
                adLibPix: true,
                voLevels: false,
                duration: 10000,
                partDefinition: {
                  storyName: 'Some video segment',
                  fields: {
                    videoId: 'my/video/id',
                  }
                }
              }
            }
          }),
        ]

        const result: Tv2VideoClipAction[] = testee.createVideoClipActions(Tv2BlueprintConfigurationTestFactory.createTv2BlueprintConfiguration(), actionManifests)

        expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Some video segment', rank: 5 })]))
        expect(result).toEqual(expect.not.arrayContaining([expect.objectContaining({ name: 'Some video segment', rank: 10 })]))
      })
    })
  })
})

function createTestee(params?: {
  actionManifestMapper?: Tv2ActionManifestMapper,
  logger?: Logger,
  videoMixerTimelineObjectFactory?: Tv2VideoMixerTimelineObjectFactory,
  audioMixerTimelineObjectFactory?: Tv2AudioMixerTimelineObjectFactory,
  videoClipTimelineObjectFactory?: Tv2VideoClipTimelineObjectFactory
}): Tv2VideoClipActionFactory {
  return new Tv2VideoClipActionFactory(
    params?.actionManifestMapper ?? new Tv2ActionManifestMapper(instance(createMockOfLogger())),
    params?.videoMixerTimelineObjectFactory ?? instance(mock<Tv2VideoMixerTimelineObjectFactory>()),
    params?.audioMixerTimelineObjectFactory ?? instance(createMockedTv2AudioMixerTimelineObjectFactory()),
    params?.videoClipTimelineObjectFactory ?? instance(mock(Tv2CasparCgTimelineObjectFactory)),
  )
}

function createMockOfLogger(): Logger {
  const mockedLogger: Logger = mock<Logger>()
  when(mockedLogger.tag(anyString())).thenCall(() => instance(mockedLogger))
  when(mockedLogger.data(anything())).thenCall(() => instance(mockedLogger))
  when(mockedLogger.metadata(anything())).thenCall(() => instance(mockedLogger))
  return mockedLogger
}

function createMockedTv2AudioMixerTimelineObjectFactory(): Tv2AudioMixerTimelineObjectFactory {
  const mockedTv2AudioMixerTimelineObjectFactory: Tv2AudioMixerTimelineObjectFactory = mock<Tv2AudioMixerTimelineObjectFactory>()
  when(mockedTv2AudioMixerTimelineObjectFactory.createVideoClipAudioTimelineObjects(anything(), anything())).thenReturn([])
  return mockedTv2AudioMixerTimelineObjectFactory
}
