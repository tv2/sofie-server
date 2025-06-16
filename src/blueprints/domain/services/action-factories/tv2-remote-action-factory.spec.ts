import { Tv2RemoteActionFactory } from './tv2-remote-action-factory'
import {
  Tv2VideoMixerTimelineObjectFactory
} from '../../interfaces/timeline-object-factories/tv2-video-mixer-timeline-object-factory'
import {
  Tv2AudioMixerTimelineObjectFactory
} from '../../interfaces/timeline-object-factories/tv2-audio-mixer-timeline-object-factory'
import { instance, mock } from '@typestrong/ts-mockito'

describe(Tv2RemoteActionFactory.name, () => {
  it('compiles', () => {
    createTestee()
  })
})

function createTestee(params?: {
  videoMixerTimelineObjectFactory?: Tv2VideoMixerTimelineObjectFactory,
  audioMixerTimelineObjectFactory?: Tv2AudioMixerTimelineObjectFactory
}): Tv2RemoteActionFactory {
  return new Tv2RemoteActionFactory(
    params?.videoMixerTimelineObjectFactory ?? instance(mock<Tv2VideoMixerTimelineObjectFactory>()),
    params?.audioMixerTimelineObjectFactory ?? instance(mock<Tv2AudioMixerTimelineObjectFactory>())
  )
}
