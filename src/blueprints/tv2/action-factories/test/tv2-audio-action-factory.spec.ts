import { Tv2AudioActionFactory } from '../tv2-audio-action-factory'
import {
  Tv2AudioMixerTimelineObjectFactory
} from '../../timeline-object-factories/interfaces/tv2-audio-mixer-timeline-object-factory'
import { instance, mock } from '@typestrong/ts-mockito'
import { Tv2CasparCgTimelineObjectFactory } from '../../timeline-object-factories/tv2-caspar-cg-timeline-object-factory'

describe(Tv2AudioActionFactory.name, () => {
  it('compiles', () => {
    createTestee()
  })
})

function createTestee(params?: {
  audioTimelineObjectFactory?: Tv2AudioMixerTimelineObjectFactory,
  casparCgTimelineObjectFactory?: Tv2CasparCgTimelineObjectFactory
}): Tv2AudioActionFactory {
  return new Tv2AudioActionFactory(
    params?.audioTimelineObjectFactory ?? instance(mock<Tv2AudioMixerTimelineObjectFactory>()),
    params?.casparCgTimelineObjectFactory ?? instance(mock(Tv2CasparCgTimelineObjectFactory))
  )
}
