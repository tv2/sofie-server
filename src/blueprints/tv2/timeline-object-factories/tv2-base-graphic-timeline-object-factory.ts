import { Tv2GraphicsData } from '../value-objects/tv2-action-manifest-data'

export abstract class Tv2BaseGraphicTimelineObjectFactory {
  /**
   * @remarks
   * For use with Graphics data generated from AdLibPieces.
   */
  protected getTemplateNameFromGraphicsData(graphicsData: Tv2GraphicsData): string {
    return graphicsData.name.split('-')[0].trim()
  }

  /**
   * @remarks
   * For use with Graphics data generated from AdLibPieces.
   */
  protected getDisplayTextFromGraphicsData(graphicsData: Tv2GraphicsData): string {
    return graphicsData.name.split('-').slice(1).join('-').trim()
  }
}