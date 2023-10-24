import { Tv2GraphicsLayer } from '../value-objects/tv2-layers'
import { Tv2GraphicsTarget } from '../value-objects/tv2-graphics-target'

export abstract class Tv2BaseGraphicTimelineObjectFactory {
  protected getLayerNameFromGraphicTarget(target: Tv2GraphicsTarget): string {
    switch (target) { // Todo: should the default case be here, throwing an 'UnexpectedCaseException'?
      case Tv2GraphicsTarget.WALL: return Tv2GraphicsLayer.GRAPHICS_WALL
      case Tv2GraphicsTarget.OVL: return Tv2GraphicsLayer.GRAPHICS_OVERLAY_PILOT
      case Tv2GraphicsTarget.FULL:
      case Tv2GraphicsTarget.TLF: return Tv2GraphicsLayer.GRAPHICS_PILOT
    }
  }

}