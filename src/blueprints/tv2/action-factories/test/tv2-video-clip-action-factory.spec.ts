import { Tv2VideoClipActionFactory } from '../tv2-video-clip-action-factory'
import {
  Tv2VideoMixerTimelineObjectFactory
} from '../../timeline-object-factories/interfaces/tv2-video-mixer-timeline-object-factory'
import {
  Tv2AudioTimelineObjectFactory
} from '../../timeline-object-factories/interfaces/tv2-audio-timeline-object-factory'
import { Tv2CasparCgTimelineObjectFactory } from '../../timeline-object-factories/tv2-caspar-cg-timeline-object-factory'
import { instance, mock } from '@typestrong/ts-mockito'

describe(Tv2VideoClipActionFactory.name, () => {
  it('compiles', () => {
    createTestee()
  })
})

function createTestee(params?: {
  videoMixerTimelineObjectFactory?: Tv2VideoMixerTimelineObjectFactory,
  audioTimelineObjectFactory?: Tv2AudioTimelineObjectFactory,
  casparCgTimelineObjectFactory?: Tv2CasparCgTimelineObjectFactory
}): Tv2VideoClipActionFactory {
  return new Tv2VideoClipActionFactory(
    params?.videoMixerTimelineObjectFactory ?? instance(mock<Tv2VideoMixerTimelineObjectFactory>()),
    params?.audioTimelineObjectFactory ?? instance(mock<Tv2AudioTimelineObjectFactory>()),
    params?.casparCgTimelineObjectFactory ?? instance(mock(Tv2CasparCgTimelineObjectFactory))
  )
}
