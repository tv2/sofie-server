import { Tv2AudioActionFactory } from '../tv2-audio-action-factory'
import {
  Tv2AudioMixerTimelineObjectFactory
} from '../../timeline-object-factories/interfaces/tv2-audio-mixer-timeline-object-factory'
import { anyString, anything, instance, mock, when } from '@typestrong/ts-mockito'
import {
  Tv2AudioBedTimelineObjectFactory
} from '../../timeline-object-factories/interfaces/tv2-audio-bed-timeline-object-factory'
import { EntityTestFactory } from '../../../../rundown-execution/domain/entities/test/entity-test-factory'
import { Tv2ActionManifest } from '../../value-objects/tv2-action-manifest'
import { Tv2BlueprintConfiguration } from '../../value-objects/tv2-blueprint-configuration'
import { Tv2BlueprintConfigurationTestFactory } from '../../test/tv2-blueprint-configuration-test-factory'
import { Tv2AudioAction } from '../../value-objects/tv2-action'
import { FrameTimeConverter } from '../../helpers/frame-time-converter'
import { Tv2ActionManifestAudioBedData } from '../../value-objects/tv2-action-manifest-data'
import { Logger } from '../../../../cross-cutting-concerns/application/logger'
import { Tv2CasparCgTimelineObjectFactory } from '../../timeline-object-factories/tv2-caspar-cg-timeline-object-factory'
import { Tv2AssetPathHelper } from '../../helpers/tv2-asset-path-helper'
import { Tv2PieceLayer } from '../../value-objects/tv2-layers'

describe(Tv2AudioActionFactory.name, () => {
  describe(Tv2AudioActionFactory.prototype.createAudioActions.name, () => {
    describe('when audio bed action manifests are given', () => {
      describe('when all audio bed actions are configured', () => {
        it('creates audio bed actions for all audio bed action manifests', () => {
          const actionManifests: Tv2ActionManifest<Tv2ActionManifestAudioBedData>[] = [
            EntityTestFactory.createActionManifest({
              actionId: Tv2PieceLayer.AUDIO_BED,
              data: {
                rank: 5,
                name: 'Audio bed A'
              }
            }),
            EntityTestFactory.createActionManifest({
              actionId: Tv2PieceLayer.AUDIO_BED,
              data: {
                rank: 10,
                name: 'Audio bed B'
              }
            }),
          ]
          const testee: Tv2AudioActionFactory = createTestee()
          const blueprintConfiguration: Tv2BlueprintConfiguration = Tv2BlueprintConfigurationTestFactory.createTv2BlueprintConfiguration({
            showStyle: {
              audioBedConfigurations: [
                {
                  id: 'audio-bed-a-configuration-id',
                  name: 'Audio bed A',
                  filename: 'audio-bed-a.mp4',
                  fadeInDurationInFrames: 0,
                  fadeOutDurationInFrames: 0,
                },
                {
                  id: 'audio-bed-b-configuration-id',
                  name: 'Audio bed B',
                  filename: 'audio-bed-b.mp4',
                  fadeInDurationInFrames: 0,
                  fadeOutDurationInFrames: 0,
                },
              ]
            }
          })
          const result: Tv2AudioAction[] = testee.createAudioActions(blueprintConfiguration, actionManifests)

          expect(result).toEqual(expect.arrayContaining([
            expect.objectContaining({name: 'Audio bed A'}),
            expect.objectContaining({name: 'Audio bed B'}),
          ]))
        })

        describe('when the same audio bed is defined multiple times', () => {
          it('returns one action with the lowest rank', () => {
            const actionManifests: Tv2ActionManifest<Tv2ActionManifestAudioBedData>[] = [
              EntityTestFactory.createActionManifest({
                actionId: Tv2PieceLayer.AUDIO_BED,
                data: {
                  rank: 5,
                  name: 'Audio bed A'
                }
              }),
              EntityTestFactory.createActionManifest({
                actionId: Tv2PieceLayer.AUDIO_BED,
                data: {
                  rank: 10,
                  name: 'Audio bed A'
                }
              }),
            ]
            const testee: Tv2AudioActionFactory = createTestee()
            const blueprintConfiguration: Tv2BlueprintConfiguration = Tv2BlueprintConfigurationTestFactory.createTv2BlueprintConfiguration({
              showStyle: {
                audioBedConfigurations: [
                  {
                    id: 'audio-bed-a-configuration-id',
                    name: 'Audio bed A',
                    filename: 'audio-bed-a.mp4',
                    fadeInDurationInFrames: 0,
                    fadeOutDurationInFrames: 0,
                  },
                ]
              }
            })
            const result: Tv2AudioAction[] = testee.createAudioActions(blueprintConfiguration, actionManifests)

            expect(result).toEqual(expect.arrayContaining([expect.objectContaining({name: 'Audio bed A', rank: 5 })]))
            expect(result).toEqual(expect.not.arrayContaining([expect.objectContaining({name: 'Audio bed A', rank: 10 })]))
          })
        })
      })

      describe('when some audio beds are not configured', () => {
        it('creates audio bed actions for all action manifests with a audio bed configuration', () => {
          const actionManifests: Tv2ActionManifest[] = [
            EntityTestFactory.createActionManifest({
              actionId: Tv2PieceLayer.AUDIO_BED,
              data: {
                rank: 0,
                name: 'Audio bed A'
              }
            }),
            EntityTestFactory.createActionManifest({
              actionId: Tv2PieceLayer.AUDIO_BED,
              data: {
                rank: 0,
                name: 'Audio bed B'
              }
            }),
            EntityTestFactory.createActionManifest({
              actionId: Tv2PieceLayer.AUDIO_BED,
              data: {
                rank: 0,
                name: 'Audio bed C'
              }
            }),
          ]
          const testee: Tv2AudioActionFactory = createTestee({})
          const blueprintConfiguration: Tv2BlueprintConfiguration = Tv2BlueprintConfigurationTestFactory.createTv2BlueprintConfiguration({
            showStyle: {
              audioBedConfigurations: [
                {
                  id: 'audio-bed-b-configuration-id',
                  name: 'Audio bed B',
                  filename: 'audio-bed-b.mp4',
                  fadeInDurationInFrames: 0,
                  fadeOutDurationInFrames: 0,
                },
                {
                  id: 'audio-bed-c-configuration-id',
                  name: 'Audio bed C',
                  filename: 'audio-bed-c.mp4',
                  fadeInDurationInFrames: 0,
                  fadeOutDurationInFrames: 0,
                },
              ]
            }
          })
          const result: Tv2AudioAction[] = testee.createAudioActions(blueprintConfiguration, actionManifests)

          expect(result).toEqual(expect.not.arrayContaining([expect.objectContaining({name: 'Audio bed A' })]))
          expect(result).toEqual(expect.arrayContaining([expect.objectContaining({name: 'Audio bed B' })]))
        })
      })
    })
  })
})

function createTestee(params: {
  audioMixerTimelineObjectFactory?: Tv2AudioMixerTimelineObjectFactory,
  audioBedTimelineObjectFactory?: Tv2AudioBedTimelineObjectFactory,
  frameTimeConverter?: FrameTimeConverter,
  logger?: Logger
} = {}): Tv2AudioActionFactory {
  return new Tv2AudioActionFactory(
    params.audioMixerTimelineObjectFactory ?? instance(mock<Tv2AudioMixerTimelineObjectFactory>()),
    params.audioBedTimelineObjectFactory ?? new Tv2CasparCgTimelineObjectFactory(new Tv2AssetPathHelper(), new FrameTimeConverter(25)),
    params.frameTimeConverter ?? instance(mock(FrameTimeConverter)),
    params.logger ?? instance(createMockOfLogger())
  )
}

function createMockOfLogger(): Logger {
  const mockedLogger: Logger = mock<Logger>()
  when(mockedLogger.tag(anyString())).thenCall(() => instance(createMockOfLogger()))
  when(mockedLogger.data(anything())).thenCall(() => instance(createMockOfLogger()))
  when(mockedLogger.metadata(anything())).thenCall(() => instance(createMockOfLogger()))
  return mockedLogger
}
