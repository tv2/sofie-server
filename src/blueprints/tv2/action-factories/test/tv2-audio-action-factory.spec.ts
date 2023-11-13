import { Tv2AudioActionFactory } from '../tv2-audio-action-factory'
import {
  Tv2AudioTimelineObjectFactory
} from '../../timeline-object-factories/interfaces/tv2-audio-timeline-object-factory'
import { instance, mock } from '@typestrong/ts-mockito'

describe(Tv2AudioActionFactory.name, () => {
  it('compiles', () => {
    createTestee()
  })
})

function createTestee(params?: {
  audioTimelineObjectFactory?: Tv2AudioTimelineObjectFactory
}): Tv2AudioActionFactory {
  return new Tv2AudioActionFactory(params?.audioTimelineObjectFactory ?? instance(mock<Tv2AudioTimelineObjectFactory>()))
}
