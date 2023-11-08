import { Tv2OverlayGraphicsManifestData } from '../value-objects/tv2-action-manifest-data'

// Todo: move content to aptly named utility class
export abstract class Tv2BaseGraphicTimelineObjectFactory {

  // Todo: merge with copy in 'Tv2GraphicsActionFactory'
  /**
   * @remarks
   * For use with Graphics data generated from AdLibPieces.
   */
  protected getTemplateName(overlayGraphicsData: Tv2OverlayGraphicsManifestData): string {
    return overlayGraphicsData.name.split('-')[0].trim()
  }

  /**
   * @remarks
   * For use with Graphics data generated from AdLibPieces.
   */
  protected getDisplayText(overlayGraphicsData: Tv2OverlayGraphicsManifestData): string {
    return overlayGraphicsData.name.split('-').slice(1).join('-').trim()
  }
}