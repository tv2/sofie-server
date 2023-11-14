import { Tv2SplitScreenActionFactory } from '../tv2-split-screen-action-factory'
import {
  Tv2VideoMixerTimelineObjectFactory
} from '../../timeline-object-factories/interfaces/tv2-video-mixer-timeline-object-factory'
import {
  Tv2AudioTimelineObjectFactory
} from '../../timeline-object-factories/interfaces/tv2-audio-timeline-object-factory'
import { instance, mock } from '@typestrong/ts-mockito'
import { Tv2CasparCgTimelineObjectFactory } from '../../timeline-object-factories/tv2-caspar-cg-timeline-object-factory'
import { AssetFolderHelper } from '../../helpers/asset-folder-helper'

describe(Tv2SplitScreenActionFactory.name, () => {
  it('compiles', () => {
    createTestee()
  })
})

function createTestee(params?: {
  videoMixerTimelineObjectFactory?: Tv2VideoMixerTimelineObjectFactory,
  audioTimelineObjectFactory?: Tv2AudioTimelineObjectFactory,
  casparCgTimelineObjectFactory?: Tv2CasparCgTimelineObjectFactory,
  asserFolderHelper?: AssetFolderHelper
}): Tv2SplitScreenActionFactory {
  return new Tv2SplitScreenActionFactory(
    params?.videoMixerTimelineObjectFactory ?? instance(mock<Tv2VideoMixerTimelineObjectFactory>()),
    params?.audioTimelineObjectFactory ?? instance(mock<Tv2AudioTimelineObjectFactory>()),
    params?.casparCgTimelineObjectFactory ?? instance(mock(Tv2CasparCgTimelineObjectFactory)),
    params?.asserFolderHelper ?? instance(mock(AssetFolderHelper))
  )
}
