import { Tv2GraphicsActionFactory } from '../tv2-graphics-action-factory'
import { instance, mock } from '@typestrong/ts-mockito'
import { Tv2VizTimelineObjectFactory } from '../../timeline-object-factories/tv2-viz-timeline-object-factory'
import { Tv2CasparCgTimelineObjectFactory } from '../../timeline-object-factories/tv2-caspar-cg-timeline-object-factory'
import {
  Tv2AudioTimelineObjectFactory
} from '../../timeline-object-factories/interfaces/tv2-audio-timeline-object-factory'
import {
  Tv2VideoMixerTimelineObjectFactory
} from '../../timeline-object-factories/interfaces/tv2-video-mixer-timeline-object-factory'
import { Tv2AssetPathHelper } from '../../helpers/tv2-asset-path-helper'
import { Tv2StringHashConverter } from '../../helpers/tv2-string-hash-converter'

describe(Tv2GraphicsActionFactory.name, () => {
  it('compiles', () => {
    createTestee()
  })
})

function createTestee(params?: {
  vizTimelineObjectFactory?: Tv2VizTimelineObjectFactory
  casparCgTimelineObjectFactory?: Tv2CasparCgTimelineObjectFactory
  audioTimelineObjectFactory?: Tv2AudioTimelineObjectFactory
  videoMixerTimelineObjectFactory?: Tv2VideoMixerTimelineObjectFactory
  assetPathHelper?: Tv2AssetPathHelper
  stringHashConverter?: Tv2StringHashConverter
}): Tv2GraphicsActionFactory {
  return new Tv2GraphicsActionFactory(
    params?.vizTimelineObjectFactory ?? instance(mock<Tv2VizTimelineObjectFactory>()),
    params?.casparCgTimelineObjectFactory ?? instance(mock<Tv2CasparCgTimelineObjectFactory>()),
    params?.audioTimelineObjectFactory ?? instance(mock<Tv2AudioTimelineObjectFactory>()),
    params?.videoMixerTimelineObjectFactory ?? instance(mock<Tv2VideoMixerTimelineObjectFactory>()),
    params?.assetPathHelper ?? instance(mock<Tv2AssetPathHelper>()),
    params?.stringHashConverter ?? instance(mock<Tv2StringHashConverter>()),

  )
}
