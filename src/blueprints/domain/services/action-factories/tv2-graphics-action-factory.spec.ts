import { Tv2GraphicsActionFactory } from './tv2-graphics-action-factory'
import { anyString, anything, instance, mock, when } from '@typestrong/ts-mockito'
import {
  Tv2AudioMixerTimelineObjectFactory
} from '../../interfaces/timeline-object-factories/tv2-audio-mixer-timeline-object-factory'
import {
  Tv2VideoMixerTimelineObjectFactory
} from '../../interfaces/timeline-object-factories/tv2-video-mixer-timeline-object-factory'
import { Tv2StringHashConverter } from '../tv2-string-hash-converter'
import {
  Tv2GraphicsTimelineObjectFactoryFactory
} from '../timeline-object-factories/tv2-graphics-timeline-object-factory-factory'
import { Tv2ActionManifestMapper } from '../tv2-action-manifest-mapper'
import { Tv2ConfigurationMapper } from '../tv2-configuration-mapper'
import { Tv2Action } from '../../value-objects/tv2-action'
import { Tv2ActionManifest } from '../../value-objects/tv2-action-manifest'
import {
  Tv2ActionManifestFullscreenGraphicsData,
  Tv2ActionManifestOverlayGraphicsData
} from '../../value-objects/tv2-action-manifest-data'
import { Tv2BlueprintConfigurationTestFactory } from '../tv2-blueprint-configuration-test-factory'
import { EntityTestFactory } from '../../../../rundown-execution/domain/entities/test/entity-test-factory'
import {
  Tv2EmptyGraphicsCommandTimelineObjectFactory
} from '../timeline-object-factories/tv2-empty-graphics-command-timeline-object-factory'
import { Tv2BlueprintConfiguration } from '../../value-objects/tv2-blueprint-configuration'
import { Tv2DownstreamKeyerRole } from '../../value-objects/tv2-studio-blueprint-configuration'
import {
  Tv2GraphicsElementTimelineObjectFactory
} from '../../interfaces/timeline-object-factories/tv2-graphics-element-timeline-object-factory'
import { DeviceType } from '../../../../rundown-execution/domain/enums/device-type'
import { Tv2PieceLayer } from '../../value-objects/tv2-layers'
import { Tv2Logger } from '../../interfaces/tv2-logger'

describe(Tv2GraphicsActionFactory.name, () => {
  describe(Tv2GraphicsActionFactory.prototype.createGraphicsActions.name, () => {
    describe('when multiple equivalent fullscreen graphics action manifests are given', () => {
      it('returns one action for the action manifest with the lowest rank', () => {
        const testee: Tv2GraphicsActionFactory = createTestee()

        const actionManifests: Tv2ActionManifest<Tv2ActionManifestFullscreenGraphicsData>[] = [
          EntityTestFactory.createActionManifest({
            actionId: 'select_full_grafik',
            data: {
              rank: 5,
              userData: {
                vcpid: 1234,
                name: 'Some fullscreen graphics',
              },
            }
          }),
          EntityTestFactory.createActionManifest({
            actionId: 'select_full_grafik',
            data: {
              rank: 10,
              userData: {
                vcpid: 1234,
                name: 'Some fullscreen graphics',
              },
            }
          }),
        ]

        const blueprintConfiguration: Tv2BlueprintConfiguration = createConfiguredBlueprintConfiguration()

        const result: Tv2Action[] = testee.createGraphicsActions(blueprintConfiguration, actionManifests)

        expect(result).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Fullscreen Graphics - Some fullscreen graphics', rank: 5 })]))
        expect(result).toEqual(expect.not.arrayContaining([expect.objectContaining({ name: 'Fullscreen Graphics - Some fullscreen graphics', rank: 10 })]))
      })
    })

    describe('when multiple equivalent ident graphics action manifests are given', () => {
      it('returns one action for each action manifest', () => {
        const testee: Tv2GraphicsActionFactory = createTestee()

        const actionManifests: Tv2ActionManifest<Tv2ActionManifestOverlayGraphicsData>[] = [
          EntityTestFactory.createActionManifest({
            actionId: 'studio0_graphicsIdent',
            data: {
              rank: 5,
              pieceLayer: Tv2PieceLayer.GRAPHICS_IDENT,
              name: 'Some ident',
            }
          }),
          EntityTestFactory.createActionManifest({
            actionId: 'studio0_graphicsIdent',
            data: {
              rank: 10,
              pieceLayer: Tv2PieceLayer.GRAPHICS_IDENT,
              name: 'Some ident',
            }
          }),
        ]

        const blueprintConfiguration: Tv2BlueprintConfiguration = createConfiguredBlueprintConfiguration()

        const result: Tv2Action[] = testee.createGraphicsActions(blueprintConfiguration, actionManifests)

        expect(result).toEqual(expect.arrayContaining([
          expect.objectContaining({ name: 'Some ident', rank: 5 }),
          expect.objectContaining({ name: 'Some ident', rank: 10 }),
        ]))
      })
    })

    describe('when multiple equivalent lower third graphics action manifests are given', () => {
      it('returns one action for each action manifest', () => {
        const testee: Tv2GraphicsActionFactory = createTestee()

        const actionManifests: Tv2ActionManifest<Tv2ActionManifestOverlayGraphicsData>[] = [
          EntityTestFactory.createActionManifest({
            actionId: 'studio0_graphicsLower',
            data: {
              rank: 5,
              pieceLayer: Tv2PieceLayer.GRAPHICS_LOWER_THIRD,
              name: 'Some lower third',
            }
          }),
          EntityTestFactory.createActionManifest({
            actionId: 'studio0_graphicsLower',
            data: {
              rank: 10,
              pieceLayer: Tv2PieceLayer.GRAPHICS_LOWER_THIRD,
              name: 'Some lower third',
            }
          }),
        ]

        const blueprintConfiguration: Tv2BlueprintConfiguration = createConfiguredBlueprintConfiguration()

        const result: Tv2Action[] = testee.createGraphicsActions(blueprintConfiguration, actionManifests)

        expect(result).toEqual(expect.arrayContaining([
          expect.objectContaining({ name: 'Some lower third', rank: 5 }),
          expect.objectContaining({ name: 'Some lower third', rank: 10 })
        ]))
      })
    })

    describe('when multiple equivalent pilot graphics action manifests are given', () => {
      it('returns one action for each action manifest', () => {
        const testee: Tv2GraphicsActionFactory = createTestee()

        const actionManifests: Tv2ActionManifest<Tv2ActionManifestOverlayGraphicsData>[] = [
          EntityTestFactory.createActionManifest({
            actionId: 'studio0_pilotOverlay',
            data: {
              rank: 5,
              pieceLayer: Tv2PieceLayer.GRAPHICS_PILOT_OVERLAY,
              name: 'Some pilot graphics',
            }
          }),
          EntityTestFactory.createActionManifest({
            actionId: 'studio0_pilotOverlay',
            data: {
              rank: 10,
              pieceLayer: Tv2PieceLayer.GRAPHICS_PILOT_OVERLAY,
              name: 'Some pilot graphics',
            }
          }),
        ]

        const blueprintConfiguration: Tv2BlueprintConfiguration = createConfiguredBlueprintConfiguration()

        const result: Tv2Action[] = testee.createGraphicsActions(blueprintConfiguration, actionManifests)

        expect(result).toEqual(expect.arrayContaining([
          expect.objectContaining({ name: 'Some pilot graphics', rank: 5 }),
          expect.objectContaining({ name: 'Some pilot graphics', rank: 10 })
        ]))
      })
    })
  })
})

function createTestee(params?: {
  actionManifestMapper?: Tv2ActionManifestMapper,
  graphicsTimelineObjectFactoryFactory?: Tv2GraphicsTimelineObjectFactoryFactory,
  audioMixerTimelineObjectFactory?: Tv2AudioMixerTimelineObjectFactory
  videoMixerTimelineObjectFactory?: Tv2VideoMixerTimelineObjectFactory
  stringHashConverter?: Tv2StringHashConverter,
  configurationMapper?: Tv2ConfigurationMapper
}): Tv2GraphicsActionFactory {
  return new Tv2GraphicsActionFactory(
    params?.actionManifestMapper ?? new Tv2ActionManifestMapper(instance(createMockOfTv2Logger())),
    params?.graphicsTimelineObjectFactoryFactory ?? instance(createMockedTv2GraphicsTimelineObjectFactoryFactory()),
    params?.audioMixerTimelineObjectFactory ?? instance(mock<Tv2AudioMixerTimelineObjectFactory>()),
    params?.videoMixerTimelineObjectFactory ?? instance(mock<Tv2VideoMixerTimelineObjectFactory>()),
    params?.stringHashConverter ?? new Tv2StringHashConverter(),
    params?.configurationMapper ?? instance(mock<Tv2ConfigurationMapper>())
  )
}

function createMockOfTv2Logger(): Tv2Logger {
  const mockedLogger: Tv2Logger = mock<Tv2Logger>()
  when(mockedLogger.tag(anyString())).thenCall(() => instance(mockedLogger))
  when(mockedLogger.data(anything())).thenCall(() => instance(mockedLogger))
  when(mockedLogger.metadata(anything())).thenCall(() => instance(mockedLogger))
  return mockedLogger
}

function createMockedTv2GraphicsTimelineObjectFactoryFactory(): Tv2GraphicsTimelineObjectFactoryFactory {
  const mockedTv2GraphicsTimelineObjectFactoryFactory: Tv2GraphicsTimelineObjectFactoryFactory = mock<Tv2GraphicsTimelineObjectFactoryFactory>()
  when(mockedTv2GraphicsTimelineObjectFactoryFactory.createGraphicsCommandTimelineObjectFactory(anything())).thenCall(() => new Tv2EmptyGraphicsCommandTimelineObjectFactory())
  when(mockedTv2GraphicsTimelineObjectFactoryFactory.createGraphicsElementTimelineObjectFactory(anything())).thenCall(() => instance(createMockedTv2GraphicsElementTimelineObjectFactory()))
  return mockedTv2GraphicsTimelineObjectFactoryFactory
}

function createMockedTv2GraphicsElementTimelineObjectFactory(): Tv2GraphicsElementTimelineObjectFactory {
  const mockedTv2GraphicsElementTimelineObjectFactory: Tv2GraphicsElementTimelineObjectFactory = mock<Tv2GraphicsElementTimelineObjectFactory>()
  when(mockedTv2GraphicsElementTimelineObjectFactory.createFullscreenGraphicsTimelineObject(anything(), anything())).thenReturn({
    content: {
      deviceType: DeviceType.CASPAR_CG,
      type: 'some-type'
    },
    enable: { start: 0 },
    id: '',
    keyframes: [],
    layer: 'some-layer'
  })
  return mockedTv2GraphicsElementTimelineObjectFactory
}

function createConfiguredBlueprintConfiguration(): Tv2BlueprintConfiguration {
  return Tv2BlueprintConfigurationTestFactory.createTv2BlueprintConfiguration({
    studio: {
      htmlGraphics: {
        msKeepOldPartAliveBeforeTakingGraphics: 500,
        graphicsUrl: 'http://localhost/graphics',
        transitionSettings: {
          wipeRate: 25,
          borderSoftness: 0,
        }
      },
      videoMixerBasicConfiguration: {
        defaultVideoMixerSource: 0,
        splitScreenArtFillSource: 0,
        splitScreenArtKeySource: 0,
        downstreamKeyers: [
          {
            id: 'dsk1',
            index: 0,
            videoMixerKeySource: 0,
            videoMixerFillSource: 1,
            defaultOn: true,
            roles: [Tv2DownstreamKeyerRole.FULL_GRAPHICS],
            videoMixerClip: 0,
            videoMixerGain: 0,
          }
        ],
        dipVideoMixerSource: 0,
      }
    }
  })
}
