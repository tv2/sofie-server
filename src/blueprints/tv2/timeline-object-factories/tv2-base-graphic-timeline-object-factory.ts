import { Tv2GraphicsData } from '../value-objects/tv2-action-manifest-data'

export abstract class Tv2BaseGraphicTimelineObjectFactory {

  // Todo: merge with copy in 'Tv2GraphicsActionFactory'
  /**
   * @remarks
   * For use with Graphics data generated from AdLibPieces.
   */
  protected getTemplateName(graphicsData: Tv2GraphicsData): string {
    return graphicsData.name.split('-')[0].trim()
  }

  /**
   * @remarks
   * For use with Graphics data generated from AdLibPieces.
   */
  protected getDisplayText(graphicsData: Tv2GraphicsData): string {
    return graphicsData.name.split('-').slice(1).join('-').trim()
  }
}