import { Tv2SplitScreenActionFactory } from '../tv2-split-screen-action-factory'
import {
  Tv2VideoMixerTimelineObjectFactory
} from '../../timeline-object-factories/interfaces/tv2-video-mixer-timeline-object-factory'
import {
  Tv2AudioTimelineObjectFactory
} from '../../timeline-object-factories/interfaces/tv2-audio-timeline-object-factory'
import { instance, mock } from '@typestrong/ts-mockito'
import { Tv2AssetPathHelper } from '../../helpers/tv2-asset-path-helper'
import {
  Tv2GraphicsSplitScreenTimelineObjectFactory
} from '../../timeline-object-factories/interfaces/tv2-graphics-split-screen-timeline-object-factory'
import {
  Tv2VideoClipTimelineObjectFactory
} from '../../timeline-object-factories/interfaces/tv2-video-clip-timeline-object-factory'

describe(Tv2SplitScreenActionFactory.name, () => {
  it('compiles', () => {
    createTestee()
  })
})

function createTestee(params?: {
  videoMixerTimelineObjectFactory?: Tv2VideoMixerTimelineObjectFactory,
  audioTimelineObjectFactory?: Tv2AudioTimelineObjectFactory,
  graphicsSplitScreenTimelineObjectFactory?: Tv2GraphicsSplitScreenTimelineObjectFactory,
  videoClipTimelineObjectFactory?: Tv2VideoClipTimelineObjectFactory,
  assetPathHelper?: Tv2AssetPathHelper
}): Tv2SplitScreenActionFactory {
  return new Tv2SplitScreenActionFactory(
    params?.videoMixerTimelineObjectFactory ?? instance(mock<Tv2VideoMixerTimelineObjectFactory>()),
    params?.audioTimelineObjectFactory ?? instance(mock<Tv2AudioTimelineObjectFactory>()),
    params?.graphicsSplitScreenTimelineObjectFactory ?? instance(mock<Tv2GraphicsSplitScreenTimelineObjectFactory>()),
    params?.videoClipTimelineObjectFactory ?? instance(mock<Tv2VideoClipTimelineObjectFactory>()),
    params?.assetPathHelper ?? instance(mock(Tv2AssetPathHelper))
  )
}
