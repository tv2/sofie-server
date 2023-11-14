import { Tv2GraphicsActionFactory } from '../tv2-graphics-action-factory'
import {
  Tv2GraphicsTimelineObjectFactory
} from '../../timeline-object-factories/interfaces/tv2-graphics-timeline-object-factory'
import { instance, mock } from '@typestrong/ts-mockito'

describe(Tv2GraphicsActionFactory.name, () => {
  it('compiles', () => {
    createTestee()
  })
})

function createTestee(params?: {
  graphicsTimelineObjectFactory?: Tv2GraphicsTimelineObjectFactory
}): Tv2GraphicsActionFactory {
  return new Tv2GraphicsActionFactory(
    params?.graphicsTimelineObjectFactory ?? instance(mock<Tv2GraphicsTimelineObjectFactory>())
  )
}
