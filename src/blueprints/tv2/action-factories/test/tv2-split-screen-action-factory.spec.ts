import { Tv2SplitScreenActionFactory } from '../tv2-split-screen-action-factory'
import {
  Tv2VideoMixerTimelineObjectFactory
} from '../../timeline-object-factories/interfaces/tv2-video-mixer-timeline-object-factory'
import {
  Tv2AudioMixerTimelineObjectFactory
} from '../../timeline-object-factories/interfaces/tv2-audio-mixer-timeline-object-factory'
import { anyString, anything, instance, mock, when } from '@typestrong/ts-mockito'
import { Tv2AssetPathHelper } from '../../helpers/tv2-asset-path-helper'
import {
  Tv2GraphicsSplitScreenTimelineObjectFactory
} from '../../timeline-object-factories/interfaces/tv2-graphics-split-screen-timeline-object-factory'
import {
  Tv2VideoClipTimelineObjectFactory
} from '../../timeline-object-factories/interfaces/tv2-video-clip-timeline-object-factory'
import { Tv2ActionManifestMapper } from '../../helpers/tv2-action-manifest-mapper'
import { Tv2StringHashConverter } from '../../helpers/tv2-string-hash-converter'
import { Tv2BlueprintConfiguration } from '../../value-objects/tv2-blueprint-configuration'
import { Tv2BlueprintConfigurationTestFactory } from '../../test/tv2-blueprint-configuration-test-factory'
import { Tv2ActionManifest } from '../../value-objects/tv2-action-manifest'
import { EntityTestFactory } from '../../../../model/entities/test/entity-test-factory'
import {
  Tv2ActionManifestSplitScreenData,
  Tv2ActionManifestSplitScreenSourceType
} from '../../value-objects/tv2-action-manifest-data'
import { Tv2Action, Tv2ActionContentType } from '../../value-objects/tv2-action'
import { PartActionType } from '../../../../model/enums/action-type'
import { Tv2Logger } from '../../tv2-logger'
import { ObjectCloner } from '../../../../business-logic/services/interfaces/object-cloner'

describe(Tv2SplitScreenActionFactory.name, () => {
  describe(Tv2SplitScreenActionFactory.prototype.createSplitScreenActions.name, () => {
    describe('when two split screen action manifests with same name and template', () => {
      describe('when they have different content', () => {
        it('returns an action per split screen variation', () => {
          const testee: Tv2SplitScreenActionFactory = createTestee()

          const blueprintConfiguration: Tv2BlueprintConfiguration = createConfiguredBlueprintConfiguration()

          const actionManifests: Tv2ActionManifest<Tv2ActionManifestSplitScreenData>[] = [
            EntityTestFactory.createActionManifest({
              actionId: 'select_dve',
              data: {
                rank: 5,
                userData: {
                  name: 'DVE Sommerfugl', config: {
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
                  name: 'DVE Sommerfugl', config: {
                    template: 'sommerfugl', labels: ['Locator 1', 'Locator2alt'], sources: {
                      INP1: {
                        sourceType: Tv2ActionManifestSplitScreenSourceType.CAMERA,
                        id: 'KAM 1',
                        name: 'KAM 1',
                      },
                      INP2: {
                        sourceType: Tv2ActionManifestSplitScreenSourceType.CAMERA,
                        id: 'KAM 1',
                        name: 'KAM 1',
                      }
                    }
                  }
                }
              }
            }),
          ]

          const result: Tv2Action[] = testee.createSplitScreenActions(blueprintConfiguration, actionManifests)

          expect(result.filter(action => action.type === PartActionType.INSERT_PART_AS_NEXT && action.metadata.contentType === Tv2ActionContentType.SPLIT_SCREEN && !action.metadata.actionSubtype)).toHaveLength(2)
        })
      })

      describe('when they have same content', () => {
        it('returns a single action for the action manifest with the lowest action rank', () => {
          const testee: Tv2SplitScreenActionFactory = createTestee()

          const blueprintConfiguration: Tv2BlueprintConfiguration = createConfiguredBlueprintConfiguration()

          const actionManifests: Tv2ActionManifest<Tv2ActionManifestSplitScreenData>[] = [
            EntityTestFactory.createActionManifest({
              actionId: 'select_dve',
              data: {
                rank: 5,
                userData: {
                  name: 'DVE Sommerfugl', config: {
                    template: 'sommerfugl', labels: ['Locator1', 'Locator2'], sources: {
                      INP1: {
                        sourceType: Tv2ActionManifestSplitScreenSourceType.CAMERA,
                        id: 'KAM 1',
                        name: 'KAM 1',
                      },
                      INP2: {
                        sourceType: Tv2ActionManifestSplitScreenSourceType.CAMERA,
                        id: 'KAM 1',
                        name: 'KAM 1',
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
                  name: 'DVE Sommerfugl', config: {
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
          ]

          const result: Tv2Action[] = testee.createSplitScreenActions(blueprintConfiguration, actionManifests)
          const splitScreenActions: Tv2Action[] = result.filter(action => action.type === PartActionType.INSERT_PART_AS_NEXT && action.metadata.contentType === Tv2ActionContentType.SPLIT_SCREEN && !action.metadata.actionSubtype)

          expect(splitScreenActions).toHaveLength(1)
          expect(splitScreenActions[0].rank).toBe(5)
        })
      })
    })
  })

  describe('when a split screen is set to an unknown template', () => {
    it('ignores the misconfigured split screen', () => {
      const testee: Tv2SplitScreenActionFactory = createTestee()

      const blueprintConfiguration: Tv2BlueprintConfiguration = createConfiguredBlueprintConfiguration()

      const actionManifests: Tv2ActionManifest<Tv2ActionManifestSplitScreenData>[] = [
        EntityTestFactory.createActionManifest({
          actionId: 'select_dve',
          data: {
            rank: 5,
            userData: {
              name: 'DVE UNKNOWN', config: {
                template: 'some-unknown-template', labels: ['Locator1', 'Locator2'], sources: {
                  INP1: {
                    sourceType: Tv2ActionManifestSplitScreenSourceType.CAMERA,
                    id: 'KAM 1',
                    name: 'KAM 1',
                  },
                  INP2: {
                    sourceType: Tv2ActionManifestSplitScreenSourceType.CAMERA,
                    id: 'KAM 1',
                    name: 'KAM 1',
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
              name: 'DVE Sommerfugl', config: {
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
        })
      ]


      const result: Tv2Action[] = testee.createSplitScreenActions(blueprintConfiguration, actionManifests)
      const splitScreenActions: Tv2Action[] = result.filter(action => action.type === PartActionType.INSERT_PART_AS_NEXT && action.metadata.contentType === Tv2ActionContentType.SPLIT_SCREEN && !action.metadata.actionSubtype)

      expect(splitScreenActions).toHaveLength(1)
      expect(splitScreenActions[0].rank).toBe(10)
    })
  })
})

function createTestee(params?: {
  actionManifestMapper?: Tv2ActionManifestMapper,
  videoMixerTimelineObjectFactory?: Tv2VideoMixerTimelineObjectFactory,
  audioMixerTimelineObjectFactory?: Tv2AudioMixerTimelineObjectFactory,
  graphicsSplitScreenTimelineObjectFactory?: Tv2GraphicsSplitScreenTimelineObjectFactory,
  videoClipTimelineObjectFactory?: Tv2VideoClipTimelineObjectFactory,
  stringHashConverter?: Tv2StringHashConverter,
  assetPathHelper?: Tv2AssetPathHelper,
  objectCloner?: ObjectCloner,
  logger?: Tv2Logger,
}): Tv2SplitScreenActionFactory {
  return new Tv2SplitScreenActionFactory(
    params?.actionManifestMapper ?? new Tv2ActionManifestMapper(instance(createMockOfTv2Logger())),
    params?.videoMixerTimelineObjectFactory ?? instance(mock<Tv2VideoMixerTimelineObjectFactory>()),
    params?.audioMixerTimelineObjectFactory ?? instance(mock<Tv2AudioMixerTimelineObjectFactory>()),
    params?.graphicsSplitScreenTimelineObjectFactory ?? instance(mock<Tv2GraphicsSplitScreenTimelineObjectFactory>()),
    params?.videoClipTimelineObjectFactory ?? instance(mock<Tv2VideoClipTimelineObjectFactory>()),
    params?.stringHashConverter ?? new Tv2StringHashConverter(),
    params?.assetPathHelper ?? instance(mock(Tv2AssetPathHelper)),
    params?.objectCloner ?? instance(mock<ObjectCloner>()),
    params?.logger ?? instance(createMockOfTv2Logger()),
  )
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
          audioLayers: [],
          usesStudioMicrophones: true,
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
          inputs: '',
          graphicsTemplateJson: '',
          key: '',
          frame: '',
        }
      ]
    }
  })
}
