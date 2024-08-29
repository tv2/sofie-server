import { Tv2GraphicsActionFactory } from '../tv2-graphics-action-factory'
import { instance, mock } from '@typestrong/ts-mockito'
import {
  Tv2AudioMixerTimelineObjectFactory
} from '../../timeline-object-factories/interfaces/tv2-audio-mixer-timeline-object-factory'
import {
  Tv2VideoMixerTimelineObjectFactory
} from '../../timeline-object-factories/interfaces/tv2-video-mixer-timeline-object-factory'
import { Tv2StringHashConverter } from '../../helpers/tv2-string-hash-converter'
import {
  Tv2GraphicsTimelineObjectFactoryFactory
} from '../../timeline-object-factories/tv2-graphics-timeline-object-factory-factory'
import { Tv2ActionManifestMapper } from '../../helpers/tv2-action-manifest-mapper'

describe(Tv2GraphicsActionFactory.name, () => {
  it('compiles', () => {
    createTestee()
  })
})

function createTestee(params?: {
  actionManifestMapper?: Tv2ActionManifestMapper,
  graphicsTimelineObjectFactoryFactory?: Tv2GraphicsTimelineObjectFactoryFactory,
  audioMixerTimelineObjectFactory?: Tv2AudioMixerTimelineObjectFactory
  videoMixerTimelineObjectFactory?: Tv2VideoMixerTimelineObjectFactory
  stringHashConverter?: Tv2StringHashConverter
}): Tv2GraphicsActionFactory {
  return new Tv2GraphicsActionFactory(
    params?.actionManifestMapper ?? instance(mock(Tv2ActionManifestMapper)),
    params?.graphicsTimelineObjectFactoryFactory ?? instance(mock<Tv2GraphicsTimelineObjectFactoryFactory>()),
    params?.audioMixerTimelineObjectFactory ?? instance(mock<Tv2AudioMixerTimelineObjectFactory>()),
    params?.videoMixerTimelineObjectFactory ?? instance(mock<Tv2VideoMixerTimelineObjectFactory>()),
    params?.stringHashConverter ?? instance(mock<Tv2StringHashConverter>()),
  )
}
