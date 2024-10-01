import { Tv2ActionManifestMapper } from '../tv2-action-manifest-mapper'
import { Tv2ActionManifest } from '../../value-objects/tv2-action-manifest'
import {
  Tv2ActionManifestFullscreenGraphicsData, Tv2ActionManifestOverlayGraphicsData,
  Tv2ActionManifestSplitScreenData,
  Tv2ActionManifestSplitScreenSourceType,
  Tv2ActionManifestVideoClipData, Tv2FullscreenGraphicsManifestData,
  Tv2SplitScreenManifestData,
  Tv2VideoClipManifestData
} from '../../value-objects/tv2-action-manifest-data'
import { EntityTestFactory } from '../../../../model/entities/test/entity-test-factory'
import { Tv2PieceType } from '../../enums/tv2-piece-type'
import { Tv2BlueprintConfiguration } from '../../value-objects/tv2-blueprint-configuration'
import { Tv2BlueprintConfigurationTestFactory } from '../../test/tv2-blueprint-configuration-test-factory'
import { Tv2Logger } from '../../tv2-logger'
import { anyString, anything, instance, mock, when } from '@typestrong/ts-mockito'
import { Tv2SourceLayer } from '../../value-objects/tv2-layers'

describe(Tv2ActionManifestMapper.name, () => {
  describe(Tv2ActionManifestMapper.prototype.filterAndMapToSplitScreenManifestData.name, () => {
    describe('when an action manifest has a invalid input source is given', () => {
      it('ignores the invalid action manifest', () => {
        const testee: Tv2ActionManifestMapper = createTestee()

        const blueprintConfiguration: Tv2BlueprintConfiguration = createConfiguredBlueprintConfiguration()

        const actionManifests: Tv2ActionManifest<Tv2ActionManifestSplitScreenData>[] = [
          EntityTestFactory.createActionManifest({
            actionId: 'select_dve',
            data: {
              rank: 5,
              userData: {
                name: 'DVE Sommerfugl',
                pieceType: Tv2PieceType.SPLIT_SCREEN,
                config: {
                  template: 'sommerfugl', labels: ['Locator1', 'Locator2'], sources: {
                    INP1: {
                      sourceType: Tv2ActionManifestSplitScreenSourceType.CAMERA,
                      id: 'KAM 1',
                      name: 'KAM 1'
                    },
                    INP2: {
                      sourceType: Tv2ActionManifestSplitScreenSourceType.CAMERA,
                      id: 'KAM 1',
                      name: 'KAM 1'
                    }
                  }
                }
              }
            }
          }),
          EntityTestFactory.createActionManifest({
            actionId: 'select_dve',
            data: {
              rank: 10,
              userData: {
                name: 'DVE Sommerfugl',
                pieceType: Tv2PieceType.SPLIT_SCREEN,
                config: {
                  template: 'sommerfugl',
                  labels: ['Locator1', 'Locator2'],
                  sources: {
                    INP1: {
                      sourceType: 'UNSUPPORTED_SOURCE_TYPE' as Tv2ActionManifestSplitScreenSourceType,
                      id: 'KAM 1',
                      name: 'KAM 1'
                    },
                    INP2: {
                      sourceType: 'UNSUPPORTED_SOURCE_TYPE' as Tv2ActionManifestSplitScreenSourceType,
                      id: 'KAM 2',
                      name: 'KAM 2'
                    }
                  }
                }
              }
            }
          }),
        ]

        const result: Tv2SplitScreenManifestData[] = testee.filterAndMapToSplitScreenManifestData(blueprintConfiguration, actionManifests)

        expect(result.length).toBe(1)
        expect(result[0].rank).toBe(5)
      })
    })
  })

  describe(Tv2ActionManifestMapper.prototype.filterAndMapToVideoClipManifestData.name, () => {
    describe('when a malformed video clip action manifest is given', () => {
      it('ignores the malformed action manifest', () => {
        const testee: Tv2ActionManifestMapper = createTestee()

        const actionManifests: Tv2ActionManifest<Tv2ActionManifestVideoClipData>[] = [
          EntityTestFactory.createActionManifest({
            actionId: 'select_server_clip',
            data: {
              rank: 5,
              userData: {
                adLibPix: false,
                voLevels: false,
                duration: 5000,
                partDefinition: {
                  storyName: 'STORY NAME',
                  fields: {
                    videoId: 'videoid'
                  }
                }
              }
            }
          }),
          EntityTestFactory.createActionManifest({
            actionId: 'select_server_clip',
            data: {
              rank: 10,
              userData: undefined as unknown as Tv2ActionManifestVideoClipData['userData'],
            }
          }),
        ]

        const result: Tv2VideoClipManifestData[] = testee.filterAndMapToVideoClipManifestData(actionManifests)

        expect(result.length).toBe(1)
        expect(result[0].rank).toBe(5)
      })
    })
  })

  describe(Tv2ActionManifestMapper.prototype.filterAndMapToFullscreenGraphicsManifestData, () => {
    describe('when a malformed fullscreen graphics action manifest is given', () => {
      it('ignores the malformed action manifest', () => {
        const testee: Tv2ActionManifestMapper = createTestee()

        const actionManifests: Tv2ActionManifest<Tv2ActionManifestFullscreenGraphicsData>[] = [
          EntityTestFactory.createActionManifest({
            actionId: 'select_full_grafik',
            data: {
              rank: 5,
              userData: {
                name: 'fullscreen graphics A',
                vcpid: 1234,
              }
            }
          }),
          EntityTestFactory.createActionManifest({
            actionId: 'select_full_grafik',
            data: {
              rank: 10,
              userData: undefined as unknown as Tv2ActionManifestFullscreenGraphicsData['userData'],
            }
          }),
        ]

        const result: Tv2FullscreenGraphicsManifestData[] = testee.filterAndMapToFullscreenGraphicsManifestData(actionManifests)

        expect(result.length).toBe(1)
        expect(result[0].rank).toBe(5)
      })
    })
  })

  describe(Tv2ActionManifestMapper.prototype.filterAndMapToOverlayGraphicsData.name, () => {
    describe('when a malformed overlay graphics action manifest is given', () => {
      it('ignores the malformed action manifest', () => {
        const testee: Tv2ActionManifestMapper = createTestee()

        const actionManifests: Tv2ActionManifest<Tv2ActionManifestOverlayGraphicsData>[] = [
          EntityTestFactory.createActionManifest({
            actionId: 'studio0_overlay',
            data: {
              rank: 5,
              sourceLayerId: Tv2SourceLayer.GRAPHICS_PILOT_OVERLAY,
              name: 'overlay graphics A',
            }
          }),
          EntityTestFactory.createActionManifest({
            actionId: 'studio0_overlay',
            data: undefined as unknown as Tv2ActionManifestOverlayGraphicsData,
          }),
        ]

        const result: Tv2FullscreenGraphicsManifestData[] = testee.filterAndMapToOverlayGraphicsData(actionManifests)

        expect(result.length).toBe(1)
        expect(result[0].rank).toBe(5)
      })
    })
  })
})

function createTestee(params: { logger?: Tv2Logger } = {}): Tv2ActionManifestMapper {
  return new Tv2ActionManifestMapper(params?.logger ?? instance(createMockOfTv2Logger()))
}

function createMockOfTv2Logger(): Tv2Logger {
  const mockedLogger: Tv2Logger = mock<Tv2Logger>()
  when(mockedLogger.tag(anyString())).thenCall(() => instance(mockedLogger))
  when(mockedLogger.data(anything())).thenCall(() => instance(mockedLogger))
  when(mockedLogger.metadata(anything())).thenCall(() => instance(mockedLogger))
  return mockedLogger
}

function createConfiguredBlueprintConfiguration(): Tv2BlueprintConfiguration {
  return Tv2BlueprintConfigurationTestFactory.createTv2BlueprintConfiguration({
    studio: {
      cameraSources: [
        {
          id: 'KAM1',
          name: 'KAM 1',
          videoMixerSource: 0,
          sisyfosLayers: [],
          studioMicrophones: true,
        }
      ]
    },
    showStyle: {
      splitScreenConfigurations: [
        {
          id: 'sommerfugl',
          name: 'sommerfugl',
          layoutProperties: {
            boxes: {
              0: {
                enabled: true,
                source: 0,
                x: 0,
                y: 0,
                size: 0,
                cropped: true,
                cropTop: 0,
                cropBottom: 0,
                cropLeft: 0,
                cropRight: 0,
              },
              1: {
                enabled: true,
                source: 0,
                x: 0,
                y: 0,
                size: 0,
                cropped: true,
                cropTop: 0,
                cropBottom: 0,
                cropLeft: 0,
                cropRight: 0,
              }
            },
            index: 0,
          },
          graphicsTemplateJson: '',
          key: '',
          frame: '',
        }
      ]
    }
  })
}
